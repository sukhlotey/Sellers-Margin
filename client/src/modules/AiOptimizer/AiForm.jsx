import { useState, useContext } from "react";
import { AiContext } from "../../context/AiContext";
import { AuthContext } from "../../context/AuthContext";
import { optimizeListing } from "../../api/aiApi";

const AiForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { setResults, setLoading } = useContext(AiContext);
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert("Fill title & description!");

    try {
      setLoading(true);
      const res = await optimizeListing({ title, description }, token);
      setResults((prev) => [res.data, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("AI Optimize error:", err.response?.data || err.message);
      alert("AI optimization failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>AI Product Listing Optimizer</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Product Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Enter Product Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <button type="submit">Optimize</button>
      </form>
    </div>
  );
};

export default AiForm;
