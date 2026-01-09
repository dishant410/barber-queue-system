# Barber Queue Management System

A modern, full-stack web application for managing barber shop queues efficiently. Built with the MERN stack (MongoDB, Express, React, Node.js).

## 🎯 Features

### For Customers
- **Remote Queue Joining**: Join the queue from anywhere without physically waiting
- **Real-time Status Tracking**: Check your position and estimated wait time
- **Digital Token System**: Receive a unique token number upon joining
- **Service Selection**: Choose from multiple service types (haircut, shave, styling, etc.)

### For Barbers
- **Live Dashboard**: View all customers in the queue in real-time
- **FIFO Queue Management**: Serve customers in first-in-first-out order
- **Quick Actions**: Start service and mark customers as completed with one click
- **Statistics**: View waiting customers, active services, and daily completions
- **Auto-refresh**: Dashboard updates automatically every 10 seconds

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API design
- MongoDB database with Mongoose ODM
- CORS enabled for cross-origin requests
- Environment-based configuration

### Frontend (React)
- Functional components with React Hooks
- React Router for navigation
- Axios for API calls
- Responsive CSS with modern design
- Auto-refresh functionality for real-time updates

## 📁 Project Structure

```
barbar-queue/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   └── queueController.js    # Business logic for queue operations
│   ├── models/
│   │   └── Customer.js           # MongoDB customer schema
│   ├── routes/
│   │   └── queueRoutes.js        # API route definitions
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js           # Landing page
│   │   │   ├── CustomerJoin.js   # Customer queue joining interface
│   │   │   ├── CustomerStatus.js # Status checking interface
│   │   │   └── BarberDashboard.js # Barber management dashboard
│   │   ├── services/
│   │   │   └── queueService.js   # API service layer
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   ├── Home.css
│   │   │   ├── CustomerJoin.css
│   │   │   ├── CustomerStatus.css
│   │   │   └── BarberDashboard.css
│   │   ├── App.js                # Main app component with routing
│   │   └── index.js              # React entry point
│   ├── .env
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

#### 1. Clone the repository
```bash
cd "d:\barbar queue"
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 4. Configure Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/barber-queue
NODE_ENV=development
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000/api
```

#### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows (if installed as service)
net start MongoDB

# On Linux/Mac
sudo systemctl start mongod
```

#### 6. Run the Application

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📡 API Endpoints

### Queue Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/queue/join` | Add customer to queue |
| GET | `/api/queue/list` | Get all customers in queue |
| GET | `/api/queue/status/:id` | Get customer status by ID/token |
| PATCH | `/api/queue/serve/:id` | Start serving a customer |
| PATCH | `/api/queue/complete/:id` | Mark service as completed |
| GET | `/api/queue/stats` | Get queue statistics |
| GET | `/api/health` | Health check endpoint |

## 🎨 UI/UX Features

- **Modern Gradient Design**: Eye-catching purple gradient backgrounds
- **Card-Based Layout**: Clean, organized information presentation
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Smooth Animations**: Fade-in effects and hover transitions
- **Color-Coded Status**: Visual indicators for queue status (waiting, in-service, completed)
- **Auto-refresh**: Real-time updates without manual refresh

## 🔧 Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend
- **React**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **CSS3**: Styling with modern features

## 🌟 Key Features Explained

### Token System
Each customer receives a unique token number that increments sequentially. This ensures fair ordering and easy tracking.

### Queue Position Calculation
The system automatically calculates and updates queue positions based on:
- Number of waiting customers ahead
- Average service time (20 minutes per customer)
- Real-time status changes

### FIFO Queue Management
Customers are served in strict first-in-first-out order, ensuring fairness and transparency.

### Scalability
The system is designed to support multiple barber shops through the `shopId` parameter, making it easy to extend.

## 🔐 Future Enhancements

- **Authentication**: Add user login for barbers
- **Real-time Notifications**: WebSocket integration for instant updates
- **SMS Notifications**: Send alerts when customer's turn is near
- **Analytics Dashboard**: Detailed reports on service times and customer flow
- **Multi-shop Support**: Manage multiple barber shop locations
- **Appointment Booking**: Allow customers to book specific time slots
- **Payment Integration**: Process payments through the system

## 📝 Code Quality

- **Clean Code**: Well-structured, readable, and maintainable
- **Comments**: Comprehensive documentation throughout
- **Error Handling**: Proper try-catch blocks and user-friendly error messages
- **Validation**: Input validation on both frontend and backend
- **Best Practices**: Following React and Node.js best practices

## 🤝 Contributing

This is a production-ready template that can be extended based on specific requirements.

## 📄 License

This project is open source and available for educational and commercial use.

## 👨‍💻 Author

Built with ❤️ for modern barber shops

---

**Happy Coding! ✂️**
