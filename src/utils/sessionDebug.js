// Session debugging utilities
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const debugSession = async (sessionId) => {
  console.log('=== Session Debug Info ===');
  console.log('Looking for session:', sessionId);
  console.log('Session ID format check:', /^[A-Z0-9]{6}$/.test(sessionId) ? 'VALID' : 'INVALID');
  console.log('Session ID length:', sessionId.length);
  
  try {
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    console.log('Document exists:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Session data:', data);
      console.log('Session status:', data.status);
      console.log('Participant count:', data.participantCount);
      console.log('Created at:', data.createdAt);
      return { success: true, data };
    } else {
      console.log('Session not found in Firestore');
      
      // Check if sessions collection exists
      const sessionsCollection = collection(db, 'sessions');
      const querySnapshot = await getDocs(sessionsCollection);
      console.log('Total sessions in collection:', querySnapshot.size);
      
      if (querySnapshot.size > 0) {
        console.log('Available session IDs:');
        querySnapshot.forEach((doc) => {
          console.log('- ' + doc.id);
        });
      }
      
      return { success: false, error: 'Session not found' };
    }
  } catch (error) {
    console.error('Debug error:', error);
    return { success: false, error: error.message };
  }
};

export const listAllSessions = async () => {
  console.log('=== All Sessions Debug ===');
  
  try {
    const sessionsCollection = collection(db, 'sessions');
    const querySnapshot = await getDocs(sessionsCollection);
    
    console.log('Total sessions found:', querySnapshot.size);
    
    const sessions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        status: data.status,
        participantCount: data.participantCount || 0,
        createdAt: data.createdAt,
        currentUrl: data.currentUrl
      });
    });
    
    console.log('Sessions:', sessions);
    return sessions;
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
};

// Add this to window for easy debugging in browser console
if (typeof window !== 'undefined') {
  window.debugSession = debugSession;
  window.listAllSessions = listAllSessions;
  console.log('Debug functions available: window.debugSession(sessionId), window.listAllSessions()');
}
