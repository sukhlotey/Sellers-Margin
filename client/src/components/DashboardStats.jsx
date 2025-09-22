import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { FaUsers, FaUserCheck, FaChartPie, FaStar } from "react-icons/fa";
import "./DashboardStats.css";

// Register Chart.js components
ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const DashboardStats = ({ dashboardData }) => {
  const [animatedTotalUsers, setAnimatedTotalUsers] = useState(0);
  const [animatedActiveUsers, setAnimatedActiveUsers] = useState(0);
  const [animatedTotalSubscriptions, setAnimatedTotalSubscriptions] = useState(0);
  const [animatedTotalFeedback, setAnimatedTotalFeedback] = useState(0);

  // Animate counters
  useEffect(() => {
    let start = 0;
    const endTotal = dashboardData.totalUsers || 0;
    const endActive = dashboardData.activeUsers?.length || 0;
    const endSubscriptions = dashboardData.subscriptions?.length || 0;
    const endFeedback = dashboardData.feedbacks?.length || 0;
    const duration = 1000; // 1 second
    const incrementTotal = endTotal / 50;
    const incrementActive = endActive / 50;
    const incrementSubscriptions = endSubscriptions / 50;
    const incrementFeedback = endFeedback / 50;

    const animate = () => {
      start += 1;
      setAnimatedTotalUsers(Math.min(Math.floor(start * incrementTotal), endTotal));
      setAnimatedActiveUsers(Math.min(Math.floor(start * incrementActive), endActive));
      setAnimatedTotalSubscriptions(Math.min(Math.floor(start * incrementSubscriptions), endSubscriptions));
      setAnimatedTotalFeedback(Math.min(Math.floor(start * incrementFeedback), endFeedback));
      if (start < 50) {
        setTimeout(animate, duration / 50);
      }
    };
    animate();
  }, [dashboardData.totalUsers, dashboardData.activeUsers, dashboardData.subscriptions, dashboardData.feedbacks]);

  // Plan distribution data
  const planCounts = dashboardData.subscriptions.reduce(
    (acc, sub) => {
      if (sub.plan === "basic_monthly") acc.basic += 1;
      else if (sub.plan === "all_monthly") acc.all += 1;
      else if (sub.plan === "annual") acc.annual += 1;
      return acc;
    },
    { basic: 0, all: 0, annual: 0 }
  );

  const planData = {
    labels: ["Basic Monthly", "All Modules Monthly", "Annual"],
    datasets: [
      {
        data: [planCounts.basic, planCounts.all, planCounts.annual],
        backgroundColor: ["#90caf9", "#ffcc80", "#f48fb1"], // New pastel colors
        hoverBackgroundColor: ["#64b5f6", "#ffb300", "#f06292"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  // Rating distribution data
  const ratingCounts = dashboardData.feedbacks.reduce(
    (acc, fb) => {
      acc[fb.rating - 1] += 1;
      return acc;
    },
    [0, 0, 0, 0, 0]
  );

  const ratingData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "Feedback Ratings",
        data: ratingCounts,
        borderColor: "#f4b400",
        backgroundColor: "rgba(244, 180, 0, 0.2)",
        fill: true,
        tension: 0.4, // Smooth line
        pointBackgroundColor: "#f4b400",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#f4b400",
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
            family: "'Roboto', sans-serif",
          },
          boxWidth: 20,
          padding: 20,
        },
      },
    },
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
            <CardContent>
              <div className="counters-grid">
                {/* Total Users */}
                <Card sx={{ textAlign: "center", p: 2, boxShadow: 3, borderRadius: 3 }}>
                  <CardContent>
                    <FaUsers size={40} color="#3f51b5" />
                    <Typography variant="h6" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {animatedTotalUsers}
                    </Typography>
                  </CardContent>
                </Card>
                {/* Active Users */}
                <Card sx={{ textAlign: "center", p: 2, boxShadow: 3, borderRadius: 3 }}>
                  <CardContent>
                    <FaUserCheck size={40} color="#4caf50" />
                    <Typography variant="h6" gutterBottom>
                      Active Users
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {animatedActiveUsers}
                    </Typography>
                  </CardContent>
                </Card>
                {/* Total Subscriptions */}
                <Card sx={{ textAlign: "center", p: 2, boxShadow: 3, borderRadius: 3 }}>
                  <CardContent>
                    <FaChartPie size={40} color="#ff9800" />
                    <Typography variant="h6" gutterBottom>
                      Total Subscriptions
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {animatedTotalSubscriptions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Basic: {planCounts.basic} | Monthly: {planCounts.all} | Annual: {planCounts.annual}
                    </Typography>
                  </CardContent>
                </Card>
                {/* Total Feedback */}
                <Card sx={{ textAlign: "center", p: 2, boxShadow: 3, borderRadius: 3 }}>
                  <CardContent>
                    <FaStar size={40} color="#f4b400" />
                    <Typography variant="h6" gutterBottom>
                      Total Feedback
                    </Typography>
                    <Typography variant="h4" sx={{ color: "#f4b400" }}>
                      {animatedTotalFeedback}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ★: {ratingCounts[0]} |
                      ★★: {ratingCounts[1]} |
                      ★★★: {ratingCounts[2]} | 
                      ★★★★: {ratingCounts[3]} | 
                      ★★★★★: {ratingCounts[4]}
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Distribution (Right) */}
        <Grid item xs={12} md={6}>
          <Card className="plan-distribution-card" sx={{ p: 3, boxShadow: 3, borderRadius: 3,width:'420px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <Pie data={planData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid className="rating-dis" item>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Distribution
              </Typography>
              <Box sx={{ height: 300}}>
                <Line
                  data={ratingData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Feedbacks",
                          font: { size: 14 },
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Rating",
                          font: { size: 14 },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;