import { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'a6e3c0b0c1f9f1b4c3d4e5f6a7b8c9d0',
      credential: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'a6e3c0b0c1f9f1b4c3d4e5f6a7b8c9d0',
      credential: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'
    }
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTCHost(sessionId, onBroadcastModeChange) {
  const [localStream, setLocalStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const peerConnections = useRef({});
  const viewerUnsubs = useRef({}); // Stores unsubscribers

  // Cleanup on unmount or stop sharing
  const stopShare = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    Object.values(viewerUnsubs.current).forEach(unsub => unsub());
    viewerUnsubs.current = {};
    setLocalStream(null);
    setIsSharing(false);
  };

  useEffect(() => {
    return () => {
      stopShare();
    };
  }, []);

  const createPeerConnection = async (viewerId, stream) => {
    console.log(`Creating peer connection for viewer: ${viewerId}`);
    console.log('Local stream tracks:', stream.getTracks());
    
    const pc = new RTCPeerConnection(servers);
    peerConnections.current[viewerId] = pc;

    // Push local tracks to connection
    console.log(`Local stream tracks: ${stream.getTracks().length}`);
    stream.getTracks().forEach((track) => {
      console.log(`Adding track to peer connection: ${track.kind}`, track.readyState);
      pc.addTrack(track, stream);
    });
    
    // Log when tracks are added to the connection
    pc.getSenders().forEach((sender) => {
      console.log(`Track sender:`, sender.track?.kind, sender.track?.readyState);
    });

    const viewerDocRef = doc(db, 'sessions', sessionId, 'viewers', viewerId);
    const hostCandidatesCol = collection(viewerDocRef, 'hostCandidates');
    const viewerCandidatesCol = collection(viewerDocRef, 'viewerCandidates');

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log(`Connected to viewer ${viewerId}`);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        if (viewerUnsubs.current[viewerId]) viewerUnsubs.current[viewerId]();
        pc.close();
        delete peerConnections.current[viewerId];
      }
    };

    // ICE connection state monitoring
    
    // Collect ICE Candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate for ${viewerId}:`, event.candidate);
        await setDoc(doc(hostCandidatesCol), event.candidate.toJSON());
      } else {
        console.log(`ICE gathering complete for ${viewerId}`);
      }
    };

    // Create Offer
    try {
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      // Store Offer
      await updateDoc(viewerDocRef, { offer });

      // Listen for Answer
      const unsubDoc = onSnapshot(viewerDocRef, async (docSnap) => {
        const data = docSnap.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          try {
            const answerDescription = new RTCSessionDescription(data.answer);
            await pc.setRemoteDescription(answerDescription);
            
            // Process any pending ICE candidates
            if (pc.pendingIceCandidates && pc.pendingIceCandidates.length > 0) {
              for (const candidateData of pc.pendingIceCandidates) {
                try {
                  const candidate = new RTCIceCandidate(candidateData);
                  await pc.addIceCandidate(candidate);
                } catch (error) {
                  console.error(`Error adding ICE candidate:`, error);
                }
              }
              pc.pendingIceCandidates = [];
            }
          } catch (error) {
            console.error(`Error setting remote description:`, error);
          }
        }
      });

      // Listen for Remote ICE Candidates
      const unsubCandidates = onSnapshot(hostCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            try {
              // Only add ICE candidates after remote description is set
              if (pc.currentRemoteDescription) {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              } else {
                // Store candidate for later addition
                if (!pc.pendingIceCandidates) {
                  pc.pendingIceCandidates = [];
                }
                pc.pendingIceCandidates.push(change.doc.data());
              }
            } catch (error) {
              console.error(`Error adding ICE candidate:`, error);
            }
          }
        });
      });

      // Track Cleanup Functions
      viewerUnsubs.current[viewerId] = () => {
        unsubDoc();
        unsubCandidates();
      };

    } catch (error) {
      console.error(`Error creating offer for ${viewerId}:`, error);
      setError(`Failed to create WebRTC connection: ${error.message}`);
    }
  };

  const startShare = async () => {
    try {
      console.log('=== STARTING SCREEN SHARE ===');
      
      // Notify parent component of broadcast mode change
      if (onBroadcastModeChange) {
        onBroadcastModeChange('screen');
      }

      console.log('Requesting display media...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      console.log('Stream created successfully');
      console.log('Stream tracks:', stream.getTracks().length);
      stream.getTracks().forEach((track) => {
        console.log(`Track: ${track.kind}`, track.readyState, track.enabled);
      });
      
      setLocalStream(stream);
      setIsSharing(true);

      // Handle user terminating stream via built-in browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopShare();
      };

      // Listen for viewers joining
      const viewersCol = collection(db, 'sessions', sessionId, 'viewers');
      const unsubViewers = onSnapshot(viewersCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const viewerId = change.doc.id;
            // Initiate P2P if not already established
            if (!peerConnections.current[viewerId]) {
              createPeerConnection(viewerId, stream);
            }
          }
        });
      });

      // Extra cleanup added to global
      viewerUnsubs.current['main_viewers_listener'] = unsubViewers;

    } catch (err) {
      console.error('Error starting screen share:', err);
      setError('Could not access screen for sharing. Permission denied.');
    }
  };

  return { localStream, isSharing, startShare, stopShare, error, connectionState };
}
