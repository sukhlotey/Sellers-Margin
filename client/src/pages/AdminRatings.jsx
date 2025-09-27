import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { getDashboardData } from "../api/authApi";
import AdminDashboardLayout from "../layout/AdminDashboardLayout";
import Masonry from "react-masonry-css";
import { FaStar, FaRegStar } from "react-icons/fa";
import "./pagesUI/AdminRatings.css";
import Loading from "../components/Loading";

const AdminRatings = () => {
  const { adminToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // Track which card is expanded
  const [selectedRating, setSelectedRating] = useState("All"); // Star rating filter
  const [selectedDate, setSelectedDate] = useState(""); // Date filter

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(adminToken);
        console.log("Received feedbacks in AdminRatings:", JSON.stringify(res.data.feedbacks, null, 2));
        setFeedbacks(res.data.feedbacks);
        setLoading(false);
      } catch (err) {
        console.error("Feedback data error:", err);
        showAlert("error", err.response?.data?.message || "Failed to load feedback data.");
        setLoading(false);
      }
    };
    if (adminToken) {
      fetchData();
    }
  }, [adminToken, showAlert]);

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span key={star}>
        {star <= rating ? <FaStar className="star-icon" /> : <FaRegStar className="star-icon" />}
      </span>
    ));
  };

  const toggleFeedback = (id) => {
    setExpanded(expanded === id ? null : id); // Toggle expanded state
  };

  // Utility function to get IST date string (YYYY-MM-DD)
  const getISTDateString = (date) => {
    const d = new Date(date);
    // Adjust to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istDate = new Date(d.getTime() + istOffset);
    return `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, "0")}-${String(istDate.getUTCDate()).padStart(2, "0")}`;
  };

  // Filter feedbacks based on rating and date
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesRating = selectedRating === "All" || fb.rating === parseInt(selectedRating);
    const feedbackDate = getISTDateString(fb.createdAt);
    const matchesDate = selectedDate === "" || feedbackDate === selectedDate;
    return matchesRating && matchesDate;
  });

  // Masonry breakpoints for responsive columns
  const breakpointColumnsObj = {
    default: 5, // 5 cards per row by default
    1200: 4,   // 4 cards per row for screens <= 1200px
    900: 3,    // 3 cards per row for screens <= 900px
    600: 2,    // 2 cards per row for screens <= 600px
    400: 1,    // 1 card per row for screens <= 400px
  };

  return (
    <AdminDashboardLayout>
      <div className="admin-ratings-container">
        <h2>All User Feedback</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="rating-filter">Filter by Rating:</label>
            <select
              id="rating-filter"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              <option value="All">All Ratings</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="date-filter">Filter by Date:</label>
            <input
              type="date"
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : filteredFeedbacks.length > 0 ? (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {filteredFeedbacks.map((fb) => {
              console.log("Rendering feedback for card:", JSON.stringify({ id: fb._id, name: fb.name, email: fb.email, userId: fb.userId }, null, 2));
              return (
                <div
                  key={fb._id}
                  className={`rating-card ${expanded === fb._id ? "expanded" : ""} ${fb.userId === null ? "deleted-user" : ""}`}
                  onClick={() => toggleFeedback(fb._id)}
                >
                  <div className="rating-card-content">
                    <h3>{fb.name || fb.userId?.name || "N/A"}</h3>
                    <p className="email">{fb.email || fb.userId?.email || "N/A"}</p>
                    <div className="stars">{renderStars(fb.rating)}</div>
                    <div className={`feedback-message ${expanded === fb._id ? "show" : ""}`}>
                      <p>{fb.feedback || "No feedback provided."}</p>
                      <span className="date">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Masonry>
        ) : (
          <p>No feedback matches the selected filters.</p>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminRatings;