# Human-in-the-Loop AI Supervisor System
A smart Ai system that learns from human supervisors to provide better customer service over time.
## What This System Does
This is an AI phone agent for a beauty salon that:
- Answers customer questions automatically when it knows the answer
- Asks human supervisors for help when it doesn't know something
-Learns from supervisors for help when it doesn't know something
- Gets smarter over time without needingto be reprogrammed

## How It Works
### 1. Customer Calls
- Customer calls the salon with a question
- AI agent tries to answer using its knowledge base
- If AI doesn't know the answer, it escalates to a human supervisor
### 2. Human Supervisor Helps
- Supervisor sees the customer's question in a dashboard
- Supervisor types the correct answer
- System sends the answer back to the customer
- Answer gets saved to AI's knowledge base automatically
### 3. AI Learns
- Next time someone asks the same or similar questions 
- AI can answer automatically without human help
- System tracks which answers are used most often 
## Key Features
- **Smart Question Matching**: AI can recognize similar questions even if worded differently
- **Real-time Dashboard**: Supervisors see new requests instantly
- **Knowledge Base Management**: View and manage all learned answers
- **Usage Analytics**: See which questions are most common
- **Automatic Learning**: No manual training required
## System Components
### 1. AI Agent ('/Simulator')
-Simulates phone calls with customers
- Shows how AI responds to different questions
- Demonstrates learning from supervisor answers
### 2. Supervisor Dashboard('/supervisor')
- shows pending help requests from customers
- Allows supervisors to provide answers
- Tracks response times and request status
### 3. Knowledge Base ('/knowledge')
- Displays all learned answers
- Shows usage statistics
- Allows manual addition of new knowledge

## Technology Stack
- **Frontend**: Next.js with React and Typescript
- **Ui Components**: shadecn/ui with Tailwind CSS
- **Database**: In-memory simulation (easily replaceable with real database)
- **AI Integration**: Simulated LiveKit agent (ready for real integration)

## Getting Started
1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`
2. **Run the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
3. **Open Your Browser**
   - Go to `http://localhost:3000`
   - Start with the main dashboard to see system overview

## Demo Flow
1. **Start at Main Dashboard** - Shows system overview and statistics
2. **Go to Simulator** - Test the Ai agent with sample questions
3. **Check Supervisor Dashboard** - See how help requests are handled
4. **View Knowledge Base** - Explore learned answers and analytics

## Environment Variables
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number for real phone integration

## Future Enhancements
- Real LiveKit integration for actual phone calls
- Real database (PostgreSQL, MySQL, etc.)
- Voice recognition and text-to-speech
- Multi-language support
- Advanced analytics and reporting

This system demonstrates the core concepts of human-in-the-loop AI learning. The AI gets smarter over time by learning from human experts, reducing the workload on supervisors while improving customer service quality.
