import { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
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

export function useWebRTCViewer(sessionId) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const pcRef = useRef(null);
  const viewerIdRef = useRef(`viewer_${Math.random().toString(36).substring(2, 9)}`);
  const unsubRefs = useRef({});

  useEffect(() => {
    if (!sessionId) return;
    
    const initViewer = async () => {
      console.log(`Initializing viewer for session: ${sessionId}`);
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;
      const viewerId = viewerIdRef.current;

      console.log(`Viewer ID: ${viewerId}`);

      const viewerDocRef = doc(db, 'sessions', sessionId, 'viewers', viewerId);
      const viewerCandidatesCol = collection(viewerDocRef, 'viewerCandidates');
      const hostCandidatesCol = collection(viewerDocRef, 'hostCandidates');

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          console.log('Connected to host');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log(`Connection lost: ${pc.connectionState}`);
        }
      };

      // Initialize the viewer document to signal the host
      try {
        await setDoc(viewerDocRef, {
          joinedAt: serverTimestamp(),
        });
        console.log(`Viewer document created for ${viewerId}`);
      } catch (error) {
        console.error('Error creating viewer document:', error);
        return;
      }

      // Stream handling
      pc.ontrack = (event) => {
        console.log(`Received remote track:`, event.track.kind);
        console.log(`Received stream:`, event.streams[0]);
        console.log(`Stream tracks:`, event.streams[0].getTracks().length);
        
        // Use the received stream directly
        const receivedStream = event.streams[0];
        setRemoteStream(receivedStream);
        
        // Log track information
        receivedStream.getTracks().forEach((track) => {
          console.log(`Track added: ${track.kind}`, track.readyState);
        });
      };

      // Collect ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log(`Sending ICE candidate:`, event.candidate);
          await setDoc(doc(viewerCandidatesCol), event.candidate.toJSON());
        } else {
          console.log('ICE gathering complete');
        }
      };

      // Listen for Host Offer
      const unsubDoc = onSnapshot(viewerDocRef, async (docSnap) => {
        const data = docSnap.data();
        
        if (!pc.currentRemoteDescription && data?.offer) {
          try {
            const offerDescription = new RTCSessionDescription(data.offer);
            await pc.setRemoteDescription(offerDescription);

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
              type: answerDescription.type,
              sdp: answerDescription.sdp,
            };
            
            await setDoc(viewerDocRef, { answer }, { merge: true });
            
            // Process any pending ICE candidates
            if (pc.pendingIceCandidates && pc.pendingIceCandidates.length > 0) {
              for (const candidateData of pc.pendingIceCandidates) {
                try {
                  const candidate = new RTCIceCandidate(candidateData);
                  await pc.addIceCandidate(candidate);
                } catch (error) {
                  console.error('Error adding pending ICE candidate:', error);
                }
              }
              pc.pendingIceCandidates = [];
            }
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
      });
      unsubRefs.current['doc'] = unsubDoc;

      // Listen for Host ICE Candidates
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
              console.error('Error adding ICE candidate:', error);
            }
          }
        });
      });
      unsubRefs.current['candidates'] = unsubCandidates;
    };

    initViewer();

    return () => {
      Object.values(unsubRefs.current).forEach(unsub => unsub());
      if (pcRef.current) pcRef.current.close();
    };
  }, [sessionId]);

  return { remoteStream, connectionState };
}
