// Simple script to create a test conversation
// Run this in the browser console after logging in

async function createTestConversation() {
    try {
        console.log('Creating test conversation...');
        
        // First, let's check if we can get participants
        const participantsResponse = await fetch('/api/communication/participants/search?limit=10', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const participantsData = await participantsResponse.json();
        console.log('Available participants:', participantsData);
        
        if (!participantsData.success || !participantsData.data || participantsData.data.length === 0) {
            console.error('No participants found');
            return;
        }
        
        // Create a test conversation
        const conversationData = {
            title: 'Test Conversation',
            type: 'group',
            participants: [
                {
                    userId: participantsData.data[0]._id,
                    role: participantsData.data[0].role
                }
            ],
            priority: 'normal',
            tags: ['test']
        };
        
        console.log('Creating conversation with data:', conversationData);
        
        const response = await fetch('/api/communication/conversations', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversationData)
        });
        
        const result = await response.json();
        console.log('Conversation creation result:', result);
        
        if (result.success) {
            console.log('✅ Test conversation created successfully!');
            
            // Now try to fetch conversations
            const fetchResponse = await fetch('/api/communication/conversations', {
                credentials: 'include'
            });
            const fetchResult = await fetchResponse.json();
            console.log('Fetched conversations:', fetchResult);
        } else {
            console.error('❌ Failed to create conversation:', result.message);
        }
        
    } catch (error) {
        console.error('Error creating test conversation:', error);
    }
}

// Run the function
createTestConversation();