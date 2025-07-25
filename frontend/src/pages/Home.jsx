import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { useDispatch, useSelector } from 'react-redux';
import { signupAdmin, resetSignupState } from '../auth/authSlice';
import { useAuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', timezone: '', company_domain: '', company_name: '' });

  const dispatch = useDispatch();
  const { signupLoading, signupError, signupSuccess } = useSelector(state => state.auth);
  const { user, userType, loading: authLoading, error: authError, login, logout } = useAuthContext();
  const navigate = useNavigate();

  // Auto-navigate if user is in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.role) {
          if (userObj.role === 'Admin') {
            navigate('/dashboard');
          } else if (userObj.role === 'Time Reporter' || userObj.role === 'Employee') {
            navigate('/summary');
          }
        }
      } catch (e) {}
    }
  }, [navigate]);

  const handleLoginChange = e => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleSignupChange = e => setSignupData({ ...signupData, [e.target.name]: e.target.value });

  const handleSignupSubmit = e => {
    e.preventDefault();
    dispatch(signupAdmin(signupData));
  };

  const handleSignupClose = () => {
    setShowSignup(false);
    dispatch(resetSignupState());
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await login(loginData.email, loginData.password);
    if (result && result.user) {
      setShowLogin(false);
      setLoginData({ email: '', password: '' });
      if (result.user.role === 'Admin') {
        navigate('/dashboard');
      } else if (result.user.role === 'Time Reporter') {
        navigate('/summary');
      }
    }
  };

  return (
    <div className="bg-accent min-h-screen w-full font-sans">
      {/* Header */}
      <header className="w-full px-10 py-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-2xl text-dark tracking-tight flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#C6F36B"/>
              <path d="M10 22L22 10M10 10H22V22" stroke="#222B20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            GreenVision
          </span>
        </div>
        {user ? null : (
          <Button variant="dark" className="px-7 py-2 text-lg shadow-none" onClick={() => setShowLogin(true)}>Login</Button>
        )}
      </header>

      {/* Login Modal */}
      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)}>
        <h2 className="text-2xl font-bold text-dark mb-6 text-center">Login</h2>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <Input name="email" value={loginData.email} onChange={handleLoginChange} placeholder="Email" type="email" required />
          <Input name="password" value={loginData.password} onChange={handleLoginChange} placeholder="Password" type="password" required />
          <Button type="submit" variant="dark" fullWidth disabled={authLoading}>{authLoading ? 'Logging in...' : 'Login'}</Button>
          {authError && <div className="text-center text-red-500 text-sm mt-2">{authError}</div>}
        </form>
        <div className="text-center mt-4 text-sm text-dark">
          Don't have an account?{' '}
          <button className="text-primary font-semibold hover:underline" onClick={() => { setShowLogin(false); setShowSignup(true); }}>Sign up</button>
        </div>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={showSignup} onClose={handleSignupClose}>
        <h2 className="text-2xl font-bold text-dark mb-6 text-center">Sign Up</h2>
        <form className="space-y-4" onSubmit={handleSignupSubmit}>
          <Input name="name" value={signupData.name} onChange={handleSignupChange} placeholder="Name" required />
          <Input name="email" value={signupData.email} onChange={handleSignupChange} placeholder="Email" type="email" required />
          <Input name="password" value={signupData.password} onChange={handleSignupChange} placeholder="Password" type="password" required />
          <Select name="timezone" value={signupData.timezone} onChange={handleSignupChange} required>
            <option value="">Select your time zone</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Chicago">America/Chicago (CST)</option>
            <option value="America/Denver">America/Denver (MST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </Select>
          <Input name="company_domain" value={signupData.company_domain} onChange={handleSignupChange} placeholder="Company domain (e.g. example.com)" required />
          <Input name="company_name" value={signupData.company_name} onChange={handleSignupChange} placeholder="Company name" required />
          <Button type="submit" variant="primary" fullWidth disabled={signupLoading}>{signupLoading ? 'Signing up...' : 'Sign Up'}</Button>
          {signupError && <div className="text-center text-red-500 text-sm mt-2">{signupError}</div>}
          {signupSuccess && <div className="text-center text-green-600 text-sm mt-2">Signup successful! You can now log in.</div>}
        </form>
        <div className="text-center mt-4 text-sm text-dark">
          Already have an account?{' '}
          <button className="text-primary font-semibold hover:underline" onClick={() => { handleSignupClose(); setShowLogin(true); }}>Login</button>
        </div>
      </Modal>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center px-[8%] py-[5%] bg-white">
        <h1 className="text-5xl md:text-[7rem] font-sans font-semibold text-textblack mb-6 leading-[6rem] w-full text-center">Managerial optimization<br/>for your company</h1>
        <p className="text-lg text-dark mb-8 max-w-2xl w-full text-center mx-auto">Choose efficiency or flexibility for your organisation, reconstruction of your team will lead to improved productivity, collaboration and higher business results.</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full justify-center items-center">
          <Button variant="primary" fullWidth={false} className="px-8 py-3 text-lg font-bold">Get Started</Button>
          <Button variant="secondary" fullWidth={false} className="px-8 py-3 text-lg font-bold">Try demo</Button>
        </div>
        <div className="w-full flex justify-center">
          <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=1200&q=80" alt="Manager working" className="rounded-2xl shadow-lg border-4 border-light w-full max-w-3xl object-cover" />
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="w-full flex flex-col md:flex-row gap-6 justify-center items-stretch px-[8%] py-12 bg-accent">
        {/* Mission Card */}
        <div className="flex-1 bg-primary rounded-2xl p-8 flex flex-col justify-between shadow-md min-w-[220px] mb-4 md:mb-0">
          <div className="text-dark text-lg font-semibold mb-2">Our mission is make your team efficient and flexible to achieve great results</div>
        </div>
        {/* 350% Stat Card */}
        <div className="flex-1 bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-md min-w-[180px] mb-4 md:mb-0">
          <div className="text-4xl font-bold text-dark mb-2">350%</div>
          <div className="text-dark text-base">Average annual growth rate among our clients</div>
        </div>
        {/* Show the results Card */}
        <div className="flex-1 bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-md min-w-[180px] mb-4 md:mb-0">
          <img src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=facearea&w=200&q=80" alt="Team" className="rounded-xl w-24 h-24 object-cover mb-2" />
          <div className="text-dark text-base">Show the results</div>
        </div>
        {/* 95% Stat Card */}
        <div className="flex-1 bg-primary rounded-2xl p-8 flex flex-col items-center justify-center shadow-md min-w-[180px]">
          <div className="text-4xl font-bold text-dark mb-2">95%</div>
          <div className="text-dark text-base">ROAS has increased to prior funding</div>
        </div>
      </section>
    </div>
  );
} 