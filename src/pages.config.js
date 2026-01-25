import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Learn from './pages/Learn';
import MyLearning from './pages/MyLearning';
import InstructorDashboard from './pages/InstructorDashboard';


export const PAGES = {
    "Home": Home,
    "Courses": Courses,
    "CourseDetails": CourseDetails,
    "Learn": Learn,
    "MyLearning": MyLearning,
    "InstructorDashboard": InstructorDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};