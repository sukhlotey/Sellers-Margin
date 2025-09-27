import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { IoHomeOutline } from "react-icons/io5";
import { GrDocumentConfig } from "react-icons/gr";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import SubscriptionStatus from "../modules/Subscription/SubscriptionStatus";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);
  const [language, setLanguage] = useState("english");

  // English welcome message
  const englishMessage = `
##### Welcome to Seller Sense — Your All-in-One Seller Growth Assistant

Running an online business is tough. Hidden fees, confusing settlements, missed GST credits, and weak product listings can cut into your profits. That’s where we help.

Our modules are designed to make selling simpler, faster, and more profitable:

**Profit & Fee Monitor**  
   Easily calculate your exact profit after marketplace fees, GST, and shipping. No more guessing margins — know before you sell.

**GST & Settlement Reconciliation**  
   Upload your settlement reports and get instant GST summaries, ITC claims, and short-payment detection. Save time on compliance and recover lost money.
  `;

  // Hindi welcome message
  const hindiMessage = `
##### सेलर सेंस में आपका स्वागत है — आपका ऑल-इन-वन सेलर ग्रोथ असिस्टेंट

ऑनलाइन बिज़नेस चलाना आसान नहीं है। छिपी हुई फीस, उलझे हुए सेटलमेंट, मिस्ड GST क्रेडिट्स और कमज़ोर प्रोडक्ट लिस्टिंग्स आपके मुनाफ़े को कम कर देती हैं। यही पर हम आपकी मदद करते हैं।

हमारे मॉड्यूल्स आपके बिज़नेस को आसान, तेज़ और अधिक लाभदायक बनाने के लिए डिज़ाइन किए गए हैं:

**प्रॉफिट और फ़ीस मॉनिटर**  
   मार्केटप्लेस की फ़ीस, GST और शिपिंग के बाद अपना सटीक मुनाफ़ा आसानी से जानें। अब अंदाज़े नहीं — बेचने से पहले ही सही मार्जिन समझें।

**GST और सेटलमेंट रिकॉन्सिलिएशन**  
   अपना सेटलमेंट रिपोर्ट अपलोड करें और तुरंत GST सारांश, ITC क्लेम और शॉर्ट-पेमेंट डिटेक्शन पाएँ। अकाउंटिंग में समय बचाएँ और छुपा हुआ पैसा वापस पाएँ।
  `;

  // Select message based on language
  const fullMessage = language === "english" ? englishMessage : hindiMessage;

  // Typing animation effect
  useEffect(() => {
    if (!showWelcomeCard) return;

    let index = 0;
    const typingSpeed = 30; // Milliseconds per character
    setWelcomeMessage(""); // Reset message on language change
    const timer = setInterval(() => {
      if (index < fullMessage.length) {
        setWelcomeMessage(fullMessage.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer); // Cleanup on unmount or language change
  }, [showWelcomeCard, fullMessage]);

  if (!user) return <h2 className="not-logged-in">Not logged in</h2>;

  const handleProfitFeePage = () => {
    navigate("/profit-fee");
  };



  const handleGstSettlement = () => {
    navigate("/gst-settlement");
  };

  const handleCloseWelcomeCard = () => {
    setShowWelcomeCard(false);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
        <div className="user-info">
          <h2 className="welcome-user">
            Welcome <span className="username">{user.name}</span>
          </h2>
          <p className="user-email">{user.email}</p>
        </div>
         <div className="spacer">
            <section className="subscription-overview">
          <h2>Your Subscription</h2>
          <SubscriptionStatus />
        </section>
        </div>
        </div>

        {showWelcomeCard && (
          <div className="welcome-card">
            <div className="welcome-card-actions">
              <select className="language-toggle" value={language} onChange={handleLanguageChange}>
                <option className="option-1" value="english">English</option>
                <option className="option-1" value="hindi">हिन्दी</option>
              </select>
              <IoClose className="cancel-icon" onClick={handleCloseWelcomeCard} />
            </div>
            <div className="welcome-message">
              <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
            </div>
          </div>
        )}
      
        <section className="modules-preview">
          <h3 className="section-title">Quick Access</h3>
          <div className="cards">
            <div className="card" onClick={handleProfitFeePage}>
              <IoHomeOutline size={40} className="card-icon" />
              <span>Profit & Fee Calculator</span>
            </div>
            <div className="card" onClick={handleGstSettlement}>
              <GrDocumentConfig size={40} className="card-icon" />
              <span>GST & Settlement</span>
            </div>

          </div>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;