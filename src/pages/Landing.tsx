import Navbar from "../components/Landing/Navbar";
import Hero from "../components/Landing/Hero";
import Features from "../components/Landing/Features";
import HowItWorks from "../components/Landing/HowItWorks";
import Pricing from "../components/Landing/Pricing";
import Footer from "../components/Landing/Footer";

const Landing: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </>
  );
};

export default Landing;
