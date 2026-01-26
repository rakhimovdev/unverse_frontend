import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <App />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/sign_in' element={<SignIn />} />
        <Route path='/sign_up' element={<SignUp />} />
        <Route path='/reading/:testId' element={<ReadingForm />} />
        <Route path='/read' element={<Reading />} />
        <Route path='/account' element={<Account />} />
        <Route path='/select' element={<Select />} />
        <Route path='/teacher' element={<Teacher />} />
        <Route path='/select_in' element={<SelectIn />} />
        <Route path='/teacher_in' element={<TeacherIn />} />
        <Route path='/teachacc' element={<TeachAcc />} />
        <Route path='/solving' element={<Solving />} />
        <Route path='/students' element={<Students />} />
        <Route path='/selectt' element={<SelectT />} />
        <Route path='/listening' element={<Listening />} />
        <Route path='/audio' element={<ListeningForm />} />
        <Route path='/listening/audio/:id' element={<SolvingL />} />
        <Route path='/writing' element={<Writing />} />
        <Route path='/writingform' element={<WritingForm />} />
        <Route path='/writingpage/:id' element={<WritingPage />} />
        <Route path='/wresault' element={<WResult />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
