# **App Name**: VoteChain

## Core Features:

- User Authentication: Secure user login with role-based access (admin/user) using Firebase Authentication and data stored in Firestore.
- Role-Based Redirection: Redirect users to the admin or user dashboard based on their role defined in Firestore.
- Preference-Based Voting: Allow users to rank candidates in order of preference for each position. The votes get recorded to the database in Firestore
- One-Time Submission: Ensure users can only submit their vote preferences once using a mechanism that validates submission in the database. For example a flag will be set in their database user document, that will be read upon accessing the voting component.
- Admin Candidate Management: Enable admins to add, delete, or modify candidate information stored in Firestore.
- Vote Tallying: Aggregate and display vote counts for each candidate and position, viewable by admins in real-time with data sourced from Firestore.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and security.
- Background color: Light gray (#F5F5F5), near-white, for a clean, modern look.
- Accent color: Teal (#009688) to highlight key actions and elements, providing a fresh and engaging feel.
- Body and headline font: 'Inter' sans-serif for clear and accessible readability.
- Use simple, clear icons to represent candidates and positions.
- Prioritize a clean and intuitive layout to facilitate easy navigation.
- Subtle animations for feedback during voting process.