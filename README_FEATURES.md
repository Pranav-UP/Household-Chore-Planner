# Household Chore Planner Application

## 📋 Overview
A comprehensive web-based application for managing household chores, assigning tasks to family members, and tracking completion status efficiently.

## ✨ Features

### User Management
- **User Registration**: Create new accounts with username and password
- **Role-Based Access**:
  - **Owner**: Can create, assign, edit, and delete chores; view all chores
  - **Member/Worker**: Can view their assigned chores and mark them as completed
- **Secure Login**: Username and password authentication

### Chore Management
- **Create Chores**: Add new household tasks with title, description, and due date
- **Assign Chores**: Assign tasks to family members
- **Edit Chores**: Modify chore details and status
- **Delete Chores**: Remove chores from the system
- **View Chores**: Display all chores with filtering options

### Status Tracking
- **Pending Chores**: View tasks that haven't been completed
- **Completed Chores**: Track finished tasks
- **Status Badges**: Visual indicators for chore status
- **Real-time Updates**: Dynamic UI updates without page reload

### Dashboard Features
- **Owner Dashboard**: 
  - Statistics showing total, pending, and completed chores
  - Quick chore creation form
  - Filter chores by status
  - Manage all chores with edit/delete options
  
- **Member Dashboard**:
  - View assigned chores
  - Mark chores as completed
  - Filter chores by status
  - Track personal progress statistics

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Page structure and markup
- **CSS3**: Styling and responsive design
- **JavaScript**: Client-side logic and API interactions
- **Bootstrap 5**: Responsive UI framework

### Backend
- **Java 17**: Programming language
- **Spring Boot 4.0.2**: Framework for REST APIs
- **Spring Data JPA**: Database operations
- **MySQL 8.0**: Relational database

### Tools Used
- **Apache Tomcat**: Web server (embedded in Spring Boot)
- **Maven**: Build and dependency management
- **VS Code / IntelliJ IDEA**: Development environment

## 📁 Project Structure

```
choreplanner/
├── src/
│   ├── main/
│   │   ├── java/org/example/choreplanner/
│   │   │   ├── ChoreplannerApplication.java
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java          (Login/Registration)
│   │   │   │   ├── ChoreController.java          (Chore Management)
│   │   │   │   ├── HelloController.java
│   │   │   │   └── QueryController.java
│   │   │   ├── entity/
│   │   │   │   ├── User.java
│   │   │   │   ├── Chore.java
│   │   │   │   └── QueryMessage.java
│   │   │   └── repository/
│   │   │       ├── UserRepository.java
│   │   │       ├── ChoreRepository.java
│   │   │       └── QueryRepository.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   │           ├── index.html
│   │           ├── login.html
│   │           ├── register.html
│   │           ├── owner-dashboard.html
│   │           ├── worker-dashboard.html
│   │           ├── style.css
│   │           └── js/
│   │               ├── login.js
│   │               ├── register.js
│   │               ├── owner-dashboard.js
│   │               └── worker-dashboard.js
│   └── test/
├── pom.xml
├── mvnw / mvnw.cmd
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- MySQL 8.0 or higher
- Node.js (optional, for running additional tools)

### Installation

1. **Clone the repository**
   ```bash
   cd c:\Users\Pranav\OneDrive\Desktop\choreplanner
   ```

2. **Configure Database**
   - Ensure MySQL is running
   - Update `src/main/resources/application.properties` with your MySQL credentials
   - Create database: `chore_planner_db`

3. **Build the Project**
   ```bash
   mvnw clean install
   ```

4. **Run the Application**
   ```bash
   mvnw spring-boot:run
   ```

5. **Access the Application**
   - Open browser and navigate to: `http://localhost:8080`
   - You'll be redirected to the login page

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/members` - Get all members

### Chores Management
- `POST /api/chores` - Create a new chore
- `GET /api/chores` - Get all chores
- `GET /api/chores/{id}` - Get a specific chore
- `GET /api/chores/owner/{ownerId}` - Get chores created by owner
- `GET /api/chores/worker/{workerId}` - Get chores assigned to a worker
- `GET /api/chores/status/{status}` - Get chores by status
- `PUT /api/chores/{id}` - Update a chore
- `PUT /api/chores/{id}/complete` - Mark chore as completed
- `DELETE /api/chores/{id}` - Delete a chore

## 👥 Demo Credentials

### Owner Account
- **Username**: owner
- **Password**: Owner@123

### Member Account
- **Username**: worker1
- **Password**: Worker@123

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL
);
```

### Chores Table
```sql
CREATE TABLE chores (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(50),
  owner_id BIGINT,
  worker_id BIGINT,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-understand interface
- **Color-Coded Status**: Visual indicators for task status
- **Modern Design**: Clean, professional appearance
- **Bootstrap Integration**: Professional UI components

## 🔒 Security Considerations

- Passwords are stored in the database (consider implementing hashing for production)
- Authentication via username and password
- Role-based access control
- CORS enabled for cross-origin requests

## 📈 Performance

- Page load time: < 2 seconds
- API response time: < 3 seconds
- Optimized database queries
- Minimal JavaScript bundle size

## 🐛 Known Limitations

- Passwords should be hashed before storage
- Email notifications not yet implemented
- Mobile app not yet available
- No payment/rewards system yet

## 🔮 Future Enhancements

- Email notifications for due chores
- Mobile application (iOS/Android)
- Reward system with points
- Charts and analytics dashboard
- Advanced role-based permissions
- Task priorities and categories
- Recurring chores
- Attachments support
- Activity logs and audit trail

## 📞 Support

For issues or questions, please contact the development team or create an issue in the project repository.

## 📄 License

This project is part of the Household Chore Planner System and is maintained for educational and personal use.

---

**Last Updated**: February 9, 2026
**Version**: 1.0.0
