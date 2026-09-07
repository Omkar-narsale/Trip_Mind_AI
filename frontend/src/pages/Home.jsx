import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TripForm from '../components/TripForm';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <TripForm />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
