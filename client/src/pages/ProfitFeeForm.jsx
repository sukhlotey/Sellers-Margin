import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import { CiCalculator2 } from "react-icons/ci";
import { IoSaveOutline } from "react-icons/io5";
import { RiDeleteBin7Line } from "react-icons/ri";

const ProfitFeeForm = () => {
  const { token } = useContext(AuthContext);
  const { addToHistory } = useContext(ProfitFeeContext);

  const [inputs, setInputs] = useState({
    productName: "",
    sellingPrice: "",
    costPrice: "",
    commissionPercent: 15,
    gstPercent: 18,
    adCost: 0,
    category: "General",
    weightSlab: "0-500",
    customWeight: "",
    customShipping: "",
  });

  const [result, setResult] = useState(null);

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

  const getCommission = (category) => {
    switch (category) {
      case "Electronics": return 8;
      case "Books": return 5;
      case "Fashion": return 15;
      default: return 15;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setInputs({ ...inputs, category: value, commissionPercent: getCommission(value) });
    } else {
      setInputs({ ...inputs, [name]: value });
    }
  };

  const calculate = () => {
    const sp = Number(inputs.sellingPrice);
    const cp = Number(inputs.costPrice);
    const comm = Number(inputs.commissionPercent);
    const gst = Number(inputs.gstPercent);
    const ads = Number(inputs.adCost);
    const ship = getShippingCost(inputs.weightSlab, inputs.customShipping);
    const weight = getWeight(inputs.weightSlab, inputs.customWeight);

    if (!inputs.productName || isNaN(sp) || isNaN(cp)) {
      alert("Please enter valid product name, SP & CP.");
      return;
    }

    const commissionFee = (sp * comm) / 100;
    const gstTax = (sp * gst) / 100;
    const profit = sp - cp - commissionFee - gstTax - ship - ads;
    const breakEvenPrice = cp + commissionFee + gstTax + ship + ads;

    setResult({
      ...inputs,
      sellingPrice: sp,
      costPrice: cp,
      commissionPercent: comm,
      gstPercent: gst,
      shippingCost: ship,
      adCost: ads,
      commissionFee,
      gstTax,
      profit,
      breakEvenPrice,
      weight,
    });
  };

  const saveRecord = async () => {
    if (!result) {
      alert("Please calculate first!");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/profit-fee/save",
        {
          ...result,
          sellingPrice: Number(result.sellingPrice),
          costPrice: Number(result.costPrice),
          commissionPercent: Number(result.commissionPercent),
          gstPercent: Number(result.gstPercent),
          shippingCost: Number(result.shippingCost),
          adCost: Number(result.adCost),
          commissionFee: Number(result.commissionFee),
          gstTax: Number(result.gstTax),
          profit: Number(result.profit),
          breakEvenPrice: Number(result.breakEvenPrice),
          weight: Number(result.weight),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToHistory(res.data);
      alert("✅ Saved successfully!");
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
    }
  };

  const handleClear=() => {
    setInputs({
      productName: "",
      sellingPrice: "",
      costPrice: "",
      commissionPercent: 15,
      gstPercent: 18,
      adCost: 0,
      category: "General",
      weightSlab: "0-500",
      customWeight: "",
      customShipping: "",
    });
    setResult(null);
  }
  return (
    <div className="profit-fee-card">
      <div className="form-group">
        <label>Product Name</label>
        <input name="productName" value={inputs.productName} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Selling Price (₹)</label>
        <input type="number" name="sellingPrice" value={inputs.sellingPrice} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Cost Price (₹)</label>
        <input type="number" name="costPrice" value={inputs.costPrice} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select name="category" value={inputs.category} onChange={handleChange}>
          <option value="">--Select Category--</option>
          <option value="General">General (15%)</option>
          <option value="Electronics">Electronics (8%)</option>
          <option value="Fashion">Fashion (15%)</option>
          <option value="Books">Books (5%)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Weight Slab</label>
        <select name="weightSlab" value={inputs.weightSlab} onChange={handleChange}>
          <option value="">--Select Weight Slab--</option>
          <option value="0-500">0 - 500g (₹40)</option>
          <option value="501-1000">501g - 1kg (₹70)</option>
          <option value="1001-5000">1kg - 5kg (₹120)</option>
          <option value="custom">Custom</option>
        </select>

        {inputs.weightSlab === "custom" && (
          <>
            <input
              type="number"
              placeholder="Enter custom weight (grams)"
              name="customWeight"
              value={inputs.customWeight}
              onChange={handleChange}
            />
            <input
              type="number"
              placeholder="Enter custom shipping cost (₹)"
              name="customShipping"
              value={inputs.customShipping}
              onChange={handleChange}
            />
          </>
        )}
      </div>

      <div className="form-group">
        <label>Ad Cost (₹)</label>
        <input type="number" name="adCost" value={inputs.adCost} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Commission %</label>
        <input type="number" name="commissionPercent" value={inputs.commissionPercent} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>GST %</label>
        <input type="number" name="gstPercent" value={inputs.gstPercent} onChange={handleChange} />
      </div>

      <button className="calc-btn" onClick={calculate}><CiCalculator2 /> Calculate</button>
      <button className="calc-btn" onClick={saveRecord}><IoSaveOutline /> Save</button>
      <button className="clear-btn" onClick={handleClear}><RiDeleteBin7Line/> Clear</button>
      {result && (
        <div className={`result-card ${result.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
          <p><strong>{result.productName}</strong></p>
          <p>Commission Fee: ₹{result.commissionFee.toFixed(2)}</p>
          <p>GST Tax: ₹{result.gstTax.toFixed(2)}</p>
          <p>Shipping Cost: ₹{result.shippingCost}</p>
          <p>Ad Cost: ₹{result.adCost}</p>
          <p>Weight: {result.weight} g</p>
          <p><strong>Final Profit: ₹{result.profit.toFixed(2)}</strong></p>
          <p><strong>Break-even Price: ₹{result.breakEvenPrice.toFixed(2)}</strong></p>
          <small>ℹ️ Break-even = minimum selling price to avoid loss.</small>
        </div>
      )}
    </div>
  );
};

export default ProfitFeeForm;