# DesiConnect

DesiConnect is a full-stack e-commerce platform designed to connect Indian sellers with customers globally. The platform provides a comprehensive solution for online selling and buying experiences with a multi-portal management system.



##  Features

- **Three Distinct Portals**: 
  - **Admin Portal**: Comprehensive management tools for platform operations
  - **Seller Portal**: Tools for product management and order fulfillment
  - **Customer Portal**: User-friendly shopping interface with checkout system

- **Authentication**: Enhanced role-based access control
- **Product Management**: Complete lifecycle with admin approval workflow
- **Order Processing**: Detailed tracking and status management

##  Tech Stack

- **Frontend**: React with TypeScript, TailwindCSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth with role-based access control

##  Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/desiconnect.git
   cd desiconnect
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/desiconnect
   SESSION_SECRET=your_session_secret
   ```

4. Initialize the database (Drizzle)
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. The application will be available at `http://localhost:5000`

##  Project Structure

```
desiconnect/
├── client/              # Frontend React application
│   ├── src/             # Source code
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── layouts/     # Page layouts
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Application pages
├── server/              # Backend Express application
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   └── utils/           # Utility functions
└── shared/              # Shared code between frontend and backend
    └── schema.ts        # Database schema with Drizzle ORM
```

##  Default Credentials

- **Customer**:
  - Email: customer@desiconnect.com
  - Password: Customer@123

##  Deployment

This application can be deployed on any platform that supports Node.js applications with PostgreSQL databases.

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Acknowledgements

- **"Local roots, global shelves"** - Connecting local Indian businesses with global markets
