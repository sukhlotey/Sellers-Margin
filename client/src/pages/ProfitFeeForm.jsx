import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import { SubscriptionContext } from "../context/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { CiCalculator2 } from "react-icons/ci";
import { IoSaveOutline } from "react-icons/io5";
import { RiDeleteBin7Line, RiCloseFill } from "react-icons/ri";
import { Button, TextField, Typography, Box, Alert, Snackbar, Modal, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { getPlans, createPayment } from "../api/subscriptionApi";
import "../modules/Subscription/Plans.css";

const ProfitFeeForm = () => {
  const { token } = useContext(AuthContext);
  const { addToHistory } = useContext(ProfitFeeContext);
  const { subscription } = useContext(SubscriptionContext);
  const navigate = useNavigate();

  const [inputs, setInputs] = useState({
    productName: "",
    sellingPrice: "",
    costPrice: "",
    importDuties: "",
    commissionPercent: 15,
    gstPercent: 18,
    adCost: 0,
    category: "General",
    weightSlab: "0-500",
    customWeight: "",
    customShipping: "",
    platform: "Amazon",
    fulfillmentType: "FBA",
    length: "",
    width: "",
    height: "",
    storageDuration: 1,
  });

  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "error" });
  const [calcCount, setCalcCount] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (token && !subscription?.isSubscribed) {
      axios
        .get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Fetched calcCount:", res.data.calcCount);
          setCalcCount(res.data.calcCount || 0);
        })
        .catch((err) => console.error("Error fetching calcCount:", err));
      getPlans()
        .then((res) => {
          const enrichedPlans = res.data
            .filter((plan) => plan.id !== "free")
            .map((plan) => ({
              ...plan,
              features:
                plan.id === "basic_monthly"
                  ? ["Unlimited calculations and savings", "Unlimited bulk calculations", "Ad free"]
                  : plan.id === "all_monthly"
                  ? ["Access all modules unlimited", "Ad free"]
                  : plan.id === "annual"
                  ? ["Discount 60%", "Access all modules unlimited", "Ad free"]
                  : [],
            }));
          console.log("Fetched plans:", enrichedPlans);
          setPlans(enrichedPlans);
        })
        .catch((err) => {
          console.error("Error fetching plans:", err);
          setAlert({ open: true, message: "Failed to load plans.", severity: "error" });
        });
    }
  }, [token, subscription]);

  const getShippingCost = (slab, customShipping) => {
    if (slab === "custom") return Number(customShipping) || 0;
    switch (slab) {
      case "0-500": return 40;
      case "501-1000": return 70;
      case "1001-5000": return 120;
      default: return 0;
    }
  };

  const getWeight = (slab, customWeight) => {
    if (slab === "custom") return Number(customWeight) || 0;
    switch (slab) {
      case "0-500": return 500;
      case "501-1000": return 1000;
      case "1001-5000": return 5000;
      default: return 0;
    }
  };

  const getCommission = (category, platform, sellingPrice) => {
    if (platform === "Amazon" && sellingPrice < 300) return 0;
    if (platform === "Amazon") {
      switch (category) {
        case "Electronics": return 8;
        case "Books": return 2;
        case "Fashion": return 17;
        default: return 15;
      }
    } else { // Flipkart
      switch (category) {
        case "Electronics": return 6;
        case "Books": return 5;
        case "Fashion": return 20;
        default: return 15;
      }
    }
  };

  const getClosingFee = (platform, sellingPrice) => {
    if (platform === "Amazon") {
      if (sellingPrice < 300) return 10;
      if (sellingPrice <= 500) return 15;
      return 45;
    } else { // Flipkart
      return sellingPrice * 0.025;
    }
  };

  const getFulfillmentFee = (platform, fulfillmentType, weightSlab, customWeight, customShipping, dimensions, storageDuration) => {
    if (fulfillmentType === "SellerFulfilled" || (platform === "Amazon" && fulfillmentType === "EasyShip")) return { pickPack: 0, weightHandling: getShippingCost(weightSlab, customShipping), storage: 0, total: getShippingCost(weightSlab, customShipping) };
    const pickPack = platform === "Amazon" ? 15 : 20;
    const weightHandling = getShippingCost(weightSlab, customShipping);
    const volumetricWeight = dimensions.length && dimensions.width && dimensions.height ? (dimensions.length * dimensions.width * dimensions.height) / 5000 : 0;
    const storage = (platform === "Amazon" ? 30 : 35) * storageDuration * (volumetricWeight || 1);
    return { pickPack, weightHandling, storage, total: pickPack + weightHandling + storage };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category" || name === "platform") {
      setInputs({ ...inputs, [name]: value, commissionPercent: getCommission(value, name === "platform" ? value : inputs.platform, inputs.sellingPrice) });
    } else {
      setInputs({ ...inputs, [name]: value });
    }
  };

  const calculate = async () => {
    const sp = Number(inputs.sellingPrice);
    const cp = Number(inputs.costPrice);
    const importDuties = Number(inputs.importDuties);
    const comm = Number(inputs.commissionPercent);
    const gst = Number(inputs.gstPercent);
    const ads = Number(inputs.adCost);
    const ship = getShippingCost(inputs.weightSlab, inputs.customShipping);
    const weight = getWeight(inputs.weightSlab, inputs.customWeight);
    const dimensions = { length: Number(inputs.length), width: Number(inputs.width), height: Number(inputs.height) };
    const storageDuration = Number(inputs.storageDuration);

    if (!subscription?.isSubscribed && calcCount >= 5) {
      setOpenModal(true);
      return;
    }

    if (!inputs.productName || isNaN(sp) || isNaN(cp) || isNaN(importDuties)) {
      setAlert({
        open: true,
        message: "Please enter valid product name, SP, CP, and import duties.",
        severity: "error",
      });
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/profit-fee/calculate",
        {
          sellingPrice: sp,
          costPrice: cp,
          importDuties,
          commissionPercent: comm,
          gstPercent: gst,
          adCost: ads,
          shippingCost: ship,
          weight,
          category: inputs.category,
          platform: inputs.platform,
          fulfillmentType: inputs.fulfillmentType,
          dimensions,
          storageDuration,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult({
        ...inputs,
        sellingPrice: sp,
        costPrice: cp,
        importDuties,
        commissionPercent: comm,
        gstPercent: gst,
        adCost: ads,
        shippingCost: ship,
        weight,
        commissionFee: res.data.commissionFee,
        closingFee: res.data.closingFee,
        fulfillmentFee: res.data.fulfillmentFee,
        gstOnFees: res.data.gstOnFees,
        outputGST: res.data.outputGST,
        inputGSTCredit: res.data.inputGSTCredit,
        netGSTRemitted: res.data.netGSTRemitted,
        netPayout: res.data.netPayout,
        profit: res.data.profit,
        breakEvenPrice: res.data.breakEvenPrice,
      });

      if (!subscription?.isSubscribed) {
        setCalcCount(res.data.usageCount);
      }
    } catch (error) {
      console.error("Calculation error:", error.response?.data || error.message);
      setAlert({
        open: true,
        message: error.response?.data?.message || "Calculation failed.",
        severity: "error",
      });
    }
  };

  const saveRecord = async () => {
    if (!result) {
      setAlert({
        open: true,
        message: "Please calculate first!",
        severity: "error",
      });
      return;
    }

    if (!subscription?.isSubscribed && calcCount > 5) {
      setOpenModal(true);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/profit-fee/save",
        {
          ...result,
          sellingPrice: Number(result.sellingPrice),
          costPrice: Number(result.costPrice),
          importDuties: Number(result.importDuties),
          commissionPercent: Number(result.commissionPercent),
          gstPercent: Number(result.gstPercent),
          adCost: Number(result.adCost),
          shippingCost: Number(result.shippingCost),
          commissionFee: Number(result.commissionFee),
          closingFee: Number(result.closingFee),
          fulfillmentFee: Number(result.fulfillmentFee),
          gstOnFees: Number(result.gstOnFees),
          outputGST: Number(result.outputGST),
          inputGSTCredit: Number(result.inputGSTCredit),
          netGSTRemitted: Number(result.netGSTRemitted),
          netPayout: Number(result.netPayout),
          profit: Number(result.profit),
          breakEvenPrice: Number(result.breakEvenPrice),
          weight: Number(result.weight),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToHistory(res.data);
      setAlert({
        open: true,
        message: "Saved successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      setAlert({
        open: true,
        message: error.response?.data?.message || "Failed to save record.",
        severity: "error",
      });
    }
  };

  const handleClear = () => {
    setInputs({
      productName: "",
      sellingPrice: "",
      costPrice: "",
      importDuties: "",
      commissionPercent: 15,
      gstPercent: 18,
      adCost: 0,
      category: "General",
      weightSlab: "0-500",
      customWeight: "",
      customShipping: "",
      platform: "Amazon",
      fulfillmentType: "FBA",
      length: "",
      width: "",
      height: "",
      storageDuration: 1,
    });
    setResult(null);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleBuy = async (plan) => {
    if (!token) {
      setAlert({ open: true, message: "Please login first!", severity: "error" });
      return;
    }
    try {
      const res = await createPayment(token, plan);
      navigate("/payment", { state: { paymentData: { order: res.data.order, plan } } });
    } catch (err) {
      console.error("Error creating payment:", err.response?.data || err.message);
      setAlert({ open: true, message: err.response?.data?.message || "Error creating payment", severity: "error" });
    }
  };

  return (
    <div className="profit-fee-card">
      <div className="settings-password-form">
        <FormControl fullWidth margin="normal">
          <InputLabel id="platform-label">Platform</InputLabel>
          <Select
            labelId="platform-label"
            name="platform"
            value={inputs.platform}
            onChange={handleChange}
            label="Platform"
          >
            <MenuItem value="Amazon">Amazon</MenuItem>
            <MenuItem value="Flipkart">Flipkart</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Product Name"
          name="productName"
          value={inputs.productName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Selling Price (₹)"
          type="number"
          name="sellingPrice"
          value={inputs.sellingPrice}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Cost Price (₹)"
          type="number"
          name="costPrice"
          value={inputs.costPrice}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Import Duties (₹)"
          type="number"
          name="importDuties"
          value={inputs.importDuties}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
       <FormControl fullWidth margin="normal">
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            name="category"
            value={inputs.category}
            onChange={handleChange}
            label="Category"
          >
            {inputs.platform === "Amazon" ? [
              <MenuItem key="General" value="General">General (15%)</MenuItem>,
              <MenuItem key="Electronics" value="Electronics">Electronics (8%)</MenuItem>,
              <MenuItem key="Fashion" value="Fashion">Fashion (17%)</MenuItem>,
              <MenuItem key="Books" value="Books">Books (2%)</MenuItem>
            ] : [
              <MenuItem key="General" value="General">General (15%)</MenuItem>,
              <MenuItem key="Electronics" value="Electronics">Electronics (6%)</MenuItem>,
              <MenuItem key="Fashion" value="Fashion">Fashion (20%)</MenuItem>,
              <MenuItem key="Books" value="Books">Books (5%)</MenuItem>
            ]}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="fulfillment-type-label">{inputs.platform === "Amazon" ? "Fulfillment Type" : "Fulfillment Type"}</InputLabel>
          <Select
            labelId="fulfillment-type-label"
            name="fulfillmentType"
            value={inputs.fulfillmentType}
            onChange={handleChange}
            label={inputs.platform === "Amazon" ? "Fulfillment Type" : "Fulfillment Type"}
          >
            {inputs.platform === "Amazon" ? [
              <MenuItem key="FBA" value="FBA">FBA</MenuItem>,
              <MenuItem key="SellerFulfilled" value="SellerFulfilled">Seller Fulfilled</MenuItem>,
              <MenuItem key="EasyShip" value="EasyShip">Easy Ship</MenuItem>
            ] : [
              <MenuItem key="FBF" value="FBF">FBF</MenuItem>,
              <MenuItem key="SellerFulfilled" value="SellerFulfilled">Seller Fulfilled</MenuItem>
            ]}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="weight-slab-label">Weight Slab</InputLabel>
          <Select
            labelId="weight-slab-label"
            name="weightSlab"
            value={inputs.weightSlab}
            onChange={handleChange}
            label="Weight Slab"
          >
            <MenuItem value="0-500">0 - 500g (₹40)</MenuItem>
            <MenuItem value="501-1000">501g - 1kg (₹70)</MenuItem>
            <MenuItem value="1001-5000">1kg - 5kg (₹120)</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        {inputs.weightSlab === "custom" && (
          <>
            <TextField
              label="Custom Weight (grams)"
              type="number"
              name="customWeight"
              value={inputs.customWeight}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Custom Shipping Cost (₹)"
              type="number"
              name="customShipping"
              value={inputs.customShipping}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </>
        )}
        {/* <FormControl fullWidth margin="normal">
          <InputLabel id="fulfillment-type-label">{inputs.platform === "Amazon" ? "Fulfillment Type" : "Fulfillment Type"}</InputLabel>
          <Select
            labelId="fulfillment-type-label"
            name="fulfillmentType"
            value={inputs.fulfillmentType}
            onChange={handleChange}
            label={inputs.platform === "Amazon" ? "Fulfillment Type" : "Fulfillment Type"}
          >
            {inputs.platform === "Amazon" ? (
              <>
                <MenuItem value="FBA">FBA</MenuItem>
                <MenuItem value="SellerFulfilled">Seller Fulfilled</MenuItem>
                <MenuItem value="EasyShip">Easy Ship</MenuItem>
              </>
            ) : (
              <>
                <MenuItem value="FBF">FBF</MenuItem>
                <MenuItem value="SellerFulfilled">Seller Fulfilled</MenuItem>
              </>
            )}
          </Select>
        </FormControl> */}
        <TextField
          label="Length (cm)"
          type="number"
          name="length"
          value={inputs.length}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Width (cm)"
          type="number"
          name="width"
          value={inputs.width}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Height (cm)"
          type="number"
          name="height"
          value={inputs.height}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Storage Duration (months)"
          type="number"
          name="storageDuration"
          value={inputs.storageDuration}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Ad Cost (₹)"
          type="number"
          name="adCost"
          value={inputs.adCost}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Commission %"
          type="number"
          name="commissionPercent"
          value={inputs.commissionPercent}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="GST %"
          type="number"
          name="gstPercent"
          value={inputs.gstPercent}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
      </div>
      {!subscription?.isSubscribed && (
        <p className="calc-count">Calculations used: {calcCount}/5</p>
      )}
      <button className="calc-btn" onClick={calculate}>
        <CiCalculator2 /> Calculate
      </button>
      <button className="calc-btn" onClick={saveRecord}>
        <IoSaveOutline /> Save
      </button>
      <button className="clear-btn" onClick={handleClear}>
        <RiDeleteBin7Line /> Clear
      </button>
      {result && (
        <div className={`result-card ${result.profit >= 0 ? "profit-positive" : "profit-negative"}`}>
          <p><strong>{result.productName}</strong> ({result.platform})</p>
          <p>Commission Fee: ₹{result.commissionFee.toFixed(2)}</p>
          <p>{result.platform === "Amazon" ? "Closing Fee" : "Collection Fee"}: ₹{result.closingFee.toFixed(2)}</p>
          <p>Fulfillment Fee: ₹{result.fulfillmentFee.toFixed(2)}</p>
          <p>GST on Fees (18%): ₹{result.gstOnFees.toFixed(2)}</p>
          <p>Output GST: ₹{result.outputGST.toFixed(2)}</p>
          <p>Input GST Credit: ₹{result.inputGSTCredit.toFixed(2)}</p>
          <p>Net GST Remitted: ₹{result.netGSTRemitted.toFixed(2)}</p>
          <p>Shipping Cost: ₹{result.shippingCost.toFixed(2)}</p>
          <p>Ad Cost: ₹{result.adCost.toFixed(2)}</p>
          <p>Weight: {result.weight} g</p>
          <p>Net Payout: ₹{result.netPayout.toFixed(2)}</p>
          <p><strong>Final Profit: ₹{result.profit.toFixed(2)}</strong></p>
          <p><strong>Break-even Price: ₹{result.breakEvenPrice.toFixed(2)}</strong></p>
          <small>ℹ️ Break-even = minimum selling price to avoid loss.</small>
        </div>
      )}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="subscription-modal-title"
        aria-describedby="subscription-modal-description"
      >
        <Box
          sx={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600, md: 800 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <style>
            {`
              .modal-plans-flex {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 1rem;
              }
              .modal-plans-flex .plan-card {
                min-height: 300px;
                flex-grow: 1;
              }
              @media (min-width: 768px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 calc(33.33% - 1.5rem);
                  max-width: calc(33.33% - 1.5rem);
                }
              }
              @media (min-width: 600px) and (max-width: 767px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 calc(50% - 1.5rem);
                  max-width: calc(50% - 1.5rem);
                }
              }
              @media (max-width: 599px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 100%;
                  max-width: 100%;
                }
              }
            `}
          </style>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "error.main",
            }}
          >
            <RiCloseFill />
          </IconButton>
          <Typography id="subscription-modal-title" variant="h6" component="h2" gutterBottom>
            Free Plan Limit Reached
          </Typography>
          <Typography id="subscription-modal-description" sx={{ mb: 3 }}>
            You've used all 5 free calculations. Upgrade to a paid plan to continue!
          </Typography>
          <div className="modal-plans-flex">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <div key={plan.id} className="plan-card">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-price">₹{plan.price}</p>
                  <p className="plan-duration">{plan.duration}</p>
                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBuy(plan.id)}
                    sx={{ mt: 2 }}
                  >
                    Buy Now
                  </Button>
                </div>
              ))
            ) : (
              <Typography>No plans available. Please try again later.</Typography>
            )}
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default ProfitFeeForm;