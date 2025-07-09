import React from 'react';
import Button from '../components/ui/Button';

export default function Home() {
  return (
    <div className="bg-white min-h-screen w-full">
      {/* Header */}
      <header className="w-full px-8 py-6 flex justify-between items-center border-b bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-2xl text-blue-700 tracking-tight">PULSE TRACKER</span>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white text-[#1d4ed8] border border-[#2563eb] hover:bg-blue-50">Sign in</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-between px-[15%] py-[10%] bg-white">
        <div className="flex-1 max-w-xl">
         
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">Time Tracking and Screenshot Monitoring Software</h1>
          <p className="text-lg text-gray-600 mb-4">Starting at just <span className="text-blue-700 font-bold">$2.99 per user/month</span> when billed annually.<br/>Try it for free. No credit card required.</p>
          <div className="flex gap-4 mb-6">
            <Button>Get started</Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center mt-10 md:mt-0">
          <img src="https://placehold.co/500x300/blue/white?text=App+Screenshot" alt="App Screenshot" className="rounded-xl shadow-lg border border-blue-100" />
        </div>
      </section>

      {/* Analytics Section */}
      <section className="w-full px-8 py-16 bg-white">
        <div className="text-center mb-8">
          <span className="text-blue-700 font-semibold text-sm uppercase tracking-widest">Workforce Productivity Analytics Software</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-2">AI-Powered Time Tracking and Productivity Analytics</h2>
          <p className="text-gray-600">An experience crafted with users in mind</p>
        </div>
        <div className="flex justify-center mb-8">
          <img src="https://placehold.co/900x350/gray/white?text=Dashboard+Screenshot" alt="Dashboard Screenshot" className="rounded-xl shadow border border-gray-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Work time tracking.</span>
              <span className="text-gray-600 ml-1">Track work hours with real-time monitoring and detailed reports.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Internet and app usage.</span>
              <span className="text-gray-600 ml-1">Monitor time spent on apps and websites with detailed insights.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Screenshot monitoring.</span>
              <span className="text-gray-600 ml-1">Capture periodic screenshots for transparency and productivity.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Attendance tracking.</span>
              <span className="text-gray-600 ml-1">Monitor presence, absences, breaks, and time off in real-time.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Offline mode.</span>
              <span className="text-gray-600 ml-1">Track time without internet, syncing automatically when online.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">●</span>
            <div>
              <span className="font-semibold text-gray-900">Unusual activity detection.</span>
              <span className="text-gray-600 ml-1">Detect irregular work patterns and receive productivity alerts.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="w-full px-[15%] py-[10%] bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Work, Your Metrics</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">Unlock powerful insights with detailed reports on work patterns, productivity, and efficiency. Understand employee behavior, streamline workflows, and make data-driven decisions to boost success.</p>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
          <div className="flex-1">
            <div className="flex gap-4 mb-2">
              <span className="text-blue-700 font-semibold cursor-pointer border-b-2 border-blue-700">Overview</span>
              <span className="text-gray-500 cursor-pointer">Screenshots</span>
              <span className="text-gray-500 cursor-pointer">Attendance</span>
              <span className="text-gray-500 cursor-pointer">Web and app usage</span>
              <span className="text-gray-500 cursor-pointer">Productivity</span>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mt-2">
              <img src="https://placehold.co/700x200/gray/white?text=Team+Overview" alt="Team Overview" className="rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="w-full bg-[#f5f7fa] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Download Pulse Tracker for your operational system</h2>
          <p className="text-center text-gray-400 mb-10">(don't forget to <a href="#" className="text-blue-500 underline">register</a> first)</p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {/* Windows Card */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-80">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2012.svg" alt="Windows" className="w-16 h-16 mb-4" />
              <div className="font-semibold text-lg text-gray-800 mb-2">Windows Agent 3.4.4</div>
              {/* 
                The Button component does not support the "as" prop by default, 
                so it always renders a <button> element, not an <a> tag.
                As a result, the "href" prop is ignored and clicking the button does not trigger a download.
                To fix this, use a real <a> tag styled like a button, or update the Button component to support "as".
              */}
              <a
                href="https://github.com/mahasagheer/employee-time-tracker/releases/download/v1.0.0/ElectronApp.exe"
                className="px-4 py-2 rounded bg-[#3ec6fa] hover:bg-[#1daae2] w-full text-white font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 text-center block"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
            {/* Mac Card */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-80">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png" alt="Mac" className="w-16 h-16 mb-4" />
              <div className="font-semibold text-lg text-gray-800 mb-2">Mac OS Agent 3.4.4</div>
              <Button className="bg-[#3ec6fa] hover:bg-[#1daae2] w-full">Download</Button>
            </div>
            {/* Linux Card */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-80">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg" alt="Linux" className="w-16 h-16 mb-4" />
              <div className="font-semibold text-lg text-gray-800 mb-2">Linux Agent 3.4.4</div>
              <Button className="bg-[#3ec6fa] hover:bg-[#1daae2] w-full">Download</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full px-[15%] py-[10%] bg-[#0a1128] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 max-w-xl text-white">
          <h2 className="text-4xl font-bold mb-4">Let's get you started</h2>
          <p className="text-lg mb-6 text-gray-200">Start tracking time, monitoring productivity, and generating insights in just minutes. WorkComposer is designed for ease, speed, and real results.</p>
          <ul className="mb-8 space-y-2">
            <li>✓ Automatic and manual time tracking</li>
            <li>✓ Real-time productivity reports</li>
            <li>✓ Web and app usage monitoring</li>
            <li>✓ Screenshots and attendance tracking</li>
            <li>✓ Easy team onboarding</li>
          </ul>
         
          <div className="text-gray-400 text-sm mt-2">No credit card required. Setup takes less than a minute.</div>
        </div>
        <div className="flex-1 flex justify-center">
          <img src="https://placehold.co/500x300/blue/white?text=App+Screenshot" alt="App Screenshot" className="rounded-xl shadow-lg border border-blue-100" />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-8 py-12 bg-[#0a1128] text-white mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 max-w-7xl mx-auto">
          <div className="flex-1 mb-8 md:mb-0">
            <div className="font-extrabold text-2xl text-blue-400 mb-2">PULSE TRACKER</div>
            <div className="text-gray-300 mb-2">Made in America us</div>
            <div className="text-gray-400 text-sm mb-4">© 2025 WorkComposer, Inc.</div>
            <div className="flex gap-4 mt-2">
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-youtube"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook"></i></a>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="font-semibold mb-2">Product</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-white">How it works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Download</a></li>
              </ul>
            </div>
           
            <div>
              <div className="font-semibold mb-2">Company</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Legal</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-white">Terms of service</a></li>
                <li><a href="#" className="hover:text-white">Privacy policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-4 flex justify-center text-gray-500 text-sm">
          <span>&copy; 2025 WorkComposer, Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
} 