import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

export function useSession(sessionId) {
  const [sessionData, setSessionData] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const docRef = doc(db, 'sessions', sessionId);
    
    console.log("Looking for session:", sessionId);
    console.log("Session ID length:", sessionId.length);
    console.log("Session ID format:", /^[A-Z0-9]{6}$/.test(sessionId) ? "Valid" : "Invalid");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      console.log("Firestore response received for session:", sessionId);
      console.log("Document exists:", docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Session data found:", data);
        setSessionData(data);
        setParticipantsCount(data.participantCount || 0);
      } else {
        console.error("Session document not found in Firestore");
        setError(`Session "${sessionId}" not found. Please check the session code and try again.`);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Critical Sync Error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      // Handle connection errors gracefully
      if (err.code === 'unavailable' || err.code === 'resource-exhausted') {
        console.log("Firestore temporarily unavailable, retrying...");
        setError("Connection temporarily unavailable. Please refresh the page.");
      } else if (err.code === 'permission-denied') {
        console.log("Permission denied, checking session access...");
        setError("Access denied. Please check your session permissions.");
      } else if (err.code === 'unauthenticated') {
        console.log("Unauthenticated access, checking auth...");
        setError("Authentication required. Please log in again.");
      } else {
        console.log("Network error detected, continuing with limited functionality...");
        setError("Network connection issue. Some features may be limited.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const joinSession = async (participantId) => {
    if (!sessionId) return;
    const docRef = doc(db, 'sessions', sessionId);
    const identifier = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    await updateDoc(docRef, {
      participantCount: (sessionData?.participantCount || 0) + 1,
      activityLogs: arrayUnion({
        id: identifier,
        action: 'Joined session',
        timestamp: new Date().toISOString()
      })
    });
  };

  const createSession = async (initialData = {}) => {
    try {
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      const adminKey = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const docRef = doc(db, 'sessions', id);
      
      console.log("Creating new session with ID:", id);
      console.log("Admin key:", adminKey);
      
      const data = {
        id,
        adminKey,
        currentUrl: initialData.currentUrl || 'https://jephthahfestus.com.ng',
        currentIndex: 0,
        playlist: initialData.currentUrl ? [initialData.currentUrl] : ['https://jephthahfestus.com.ng'],
        isLocked: false,
        forceFullscreen: true,
        status: 'ready',
        participantCount: 0,
        activityLogs: [],
        quitPassword: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
        ...initialData
      };

      console.log("Session data to be written:", data);
      
      await setDoc(docRef, data);
      
      // Verify the session was created by trying to read it back
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        console.log("Session successfully created and verified in Firestore");
        console.log("Session document ID:", verifyDoc.id);
        return { id, adminKey };
      } else {
        throw new Error("Session was not successfully created in Firestore");
      }
    } catch (err) {
      console.error("Critical error in createSession:", err);
      console.error("Firebase error code:", err.code);
      console.error("Firebase error message:", err.message);
      throw new Error(`Failed to create session: ${err.message}`);
    }
  };

  const updateSession = async (updates) => {
    if (!sessionId) return;
    const docRef = doc(db, 'sessions', sessionId);
    await updateDoc(docRef, updates);
  };

  const nextContent = async () => {
    if (!sessionData?.playlist?.length) return;
    const nextIndex = (sessionData.currentIndex + 1) % sessionData.playlist.length;
    await updateSession({
      currentIndex: nextIndex,
      currentUrl: sessionData.playlist[nextIndex]
    });
  };

  const prevContent = async () => {
    if (!sessionData?.playlist?.length) return;
    const prevIndex = (sessionData.currentIndex - 1 + sessionData.playlist.length) % sessionData.playlist.length;
    await updateSession({
      currentIndex: prevIndex,
      currentUrl: sessionData.playlist[prevIndex]
    });
  };

  const addToPlaylist = async (url) => {
    if (!sessionId) return;
    const newPlaylist = [...(sessionData?.playlist || []), url];
    await updateSession({ 
      playlist: newPlaylist,
      currentUrl: sessionData?.currentUrl || url 
    });
  };

  const endSession = async () => {
    if (!sessionId) return;
    await updateSession({ status: 'ended', isLocked: false, currentUrl: '' });
  };

  return { 
    sessionData, 
    participantsCount, 
    loading, 
    error, 
    createSession, 
    updateSession, 
    joinSession,
    nextContent,
    prevContent,
    addToPlaylist,
    endSession
  };
}
