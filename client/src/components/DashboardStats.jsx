import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { FaUsers, FaUserCheck } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DashboardStats = ({ dashboardData }) => {
  const [animatedTotalUsers, setAnimatedTotalUsers] = useState(0);
  const [animatedActiveUsers, setAnimatedActiveUsers] = useState(0);

  // Animate counters
  useEffect(() => {
    let start = 0;
    const endTotal = dashboardData.totalUsers || 0;
    const endActive = dashboardData.activeUsers?.length || 0;
    const duration = 1000; // 1 second
    const incrementTotal = endTotal / 50;
    const incrementActive = endActive / 50;

    const animate = () => {
      start += 1;
      setAnimatedTotalUsers(Math.min(Math.floor(start * incrementTotal), endTotal));
      setAnimatedActiveUsers(Math.min(Math.floor(start * incrementActive), endActive));
      if (start < 50) {
        setTimeout(animate, duration / 50);
      }
    };
    animate();
  }, [dashboardData.totalUsers, dashboardData.activeUsers]);

  // Plan distribution data (basic_monthly and annual)
  // Plan distribution data (basic_monthly, all_monthly, and annual)
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
        backgroundColor: ["#3f51b5", "#ff9800", "#f50057"],
        hoverBackgroundColor: ["#303f9f", "#f57c00", "#c51162"],
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
        backgroundColor: "#f4b400",
        borderColor: "#f4b400",
        borderWidth: 1,
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
        },
      },
    },
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Statistics Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>

        {/* Active Users */}
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Distribution
              </Typography>
              <Box sx={{ height: 200 }}>
                <Pie data={planData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={12}>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <Bar
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