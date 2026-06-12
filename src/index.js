import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import SignIn from './Pages/Sign_in/Sign_in';
import SignUp from './Pages/Sign_up/Sign_up';
import ReadingForm from './Pages/ReadingForm/ReadingForm';
import Reading from './Pages/Reading/Banner';
import Navbar from './components/Navbar/Navbar';
import Account from './Pages/Account/Account';
import Select from './Pages/Select/Select';
import TeacherIn from './Pages/Teacher_up/Teacher_in';
import SelectIn from './Pages/Select_in/Select_in';
import Teacher from './Pages/Teacher/Teacher';
import TeachAcc from './Pages/Teacher_acc/TeachAcc';
import Solving from './Pages/Solving/Solving';
import Students from './Pages/Students/Students';
import Listening from './Pages/Listening/Listening';
import SelectT from './Pages/SelectTest/SelectT';
import ListeningForm from './Pages/ListningForm/ListeningForm';
import SolvingL from "./Pages/listeningSolving/Solving";
import Writing from './Pages/Writing/Writing';
import Home from './Pages/Home/Home';
import WritingForm from './Pages/WritingForm/Writing';
import WritingPage from './Pages/WritingPage/Index';
import WResult from './Pages/Writing_resault/wResault';
import Admin from './Pages/Admin/Admin';
import AdminLogin from './Pages/AdminLogin/AdminLogin';
import AdminSignup from './Pages/AdminSignup/AdminSignup';
import OtpVerification from './Pages/OtpVerification/OtpVerification';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import { studentRoles } from './utils/authRoutes';
import Pricing from './Pages/Pricing/Pricing';
import PaymentSuccess from './Pages/PaymentSuccess/PaymentSuccess';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Providers = ({ children }) => {
  if (!googleClientId) {
    return children;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Providers>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <App />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/read' element={<Reading />} />
            <Route path='/select' element={<Select />} />
            <Route path='/select_in' element={<SelectIn />} />
            <Route path='/solving' element={<Solving />} />
            <Route path='/listening' element={<Listening />} />
            <Route path='/audio' element={<ListeningForm />} />
            <Route path='/writing' element={<Writing />} />
            <Route path='/writingform' element={<WritingForm />} />
            <Route path='/wresault' element={<WResult />} />
            {/* Payme uchun yangi routelar */}
            <Route path='/pricing' element={<Pricing />} />
            <Route path='/upgrade' element={<Pricing />} />
            <Route path='/payment/success' element={<PaymentSuccess />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path='/sign_in' element={<SignIn />} />
              <Route path='/sign_up' element={<SignUp />} />
              <Route path='/verify-otp' element={<OtpVerification />} />
              <Route path='/teacher' element={<Teacher />} />
              <Route path='/teacher_in' element={<TeacherIn />} />
              <Route path='/admin_login' element={<AdminLogin />} />
              <Route path='/admin_signup' element={<AdminSignup />} />
            </Route>

            <Route element={<ProtectedRoute roles={studentRoles} />}>
              <Route path='/account' element={<Account />} />
              <Route path='/dashboard' element={<Account />} />
              <Route path='/results-center' element={<Account />} />
              <Route path='/reading/:testId' element={<ReadingForm />} />
              <Route path='/listening/audio/:id' element={<SolvingL />} />
              <Route path='/writingpage/:id' element={<WritingPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['teacher']} />}>
              <Route path='/teachacc' element={<TeachAcc />} />
              <Route path='/students' element={<Students />} />
              <Route path='/selectt' element={<SelectT />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path='/admin' element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Providers>
  </React.StrictMode>
);
