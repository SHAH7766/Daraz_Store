import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeDollarSign,
  Boxes,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  ImagePlus,
  PackageCheck,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import './styles.css';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/product';
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '').endsWith('/api/product')
  ? rawApiBaseUrl.replace(/\/$/, '')
  : `${rawApiBaseUrl.replace(/\/$/, '')}/api/product`;

const statusOptions = [
  { value: 'Shipped', label: 'Shipped', icon: Truck },
  { value: 'Delievered', label: 'Delivered', icon: CheckCircle2 },
  { value: 'Return', label: 'Return', icon: RefreshCw },
  { value: 'Failed', label: 'Failed', icon: XCircle },
];

const statusMeta = statusOptions.reduce((acc, status) => {
  acc[status.value] = status;
  return acc;
}, {});

const emptyForm = {
  name: '',
  price: '',
  quantity: '1',
  finalPrice: '',
  PriceGivenAdvance: '',
  status: 'Shipped',
  image: null,
  PaymentScreenShot: null,
};
const imageExtensionPattern = /\.(avif|gif|heic|heif|jfif|jpe?g|png|webp)$/i;

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [formVersion, setFormVersion] = useState(0);

  const productPreview = useObjectUrl(form.image);
  const paymentPreview = useObjectUrl(form.PaymentScreenShot);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        signal: controller.signal,
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(data, 'Unable to load products'));
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'The API did not respond. Check that MongoDB is connected.' : err.message);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const totalUnits = products.reduce((sum, product) => sum + quantityOf(product), 0);
    const totalSale = products.reduce((sum, product) => sum + productValue(product), 0);
    const advance = products.reduce((sum, product) => sum + numeric(product.PriceGivenAdvance), 0);
    const profit = products.reduce((sum, product) => sum + profitOf(product), 0);
    const delivered = products.filter((product) => product.status === 'Delievered').length;

    return [
      {
        label: 'Products',
        value: products.length,
        icon: ShoppingBag,
      },
      {
        label: 'Total Units',
        value: totalUnits,
        icon: Boxes,
      },
      {
        label: 'Total Sale',
        value: money(totalSale),
        icon: BadgeDollarSign,
      },
      {
        label: 'Advance Paid',
        value: money(advance),
        icon: CircleDollarSign,
      },
      {
        label: 'Profit',
        value: money(profit),
        icon: TrendingUp,
      },
      {
        label: 'Delivered',
        value: delivered,
        icon: ShieldCheck,
      },
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery = !term || product.name?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' || product.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [products, query, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setFormVersion((version) => version + 1);
    setError('');
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    const file = files?.[0];

    if (file && !isImageFile(file)) {
      event.target.value = '';
      setError(`${file.name} is not an image file. Please choose JPG, PNG, WEBP, AVIF, GIF, HEIC, or JFIF.`);
      return;
    }

    if (file) {
      setError('');
    }

    setForm((current) => ({
      ...current,
      [name]: files ? file : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (!editingProduct && (!form.image || !form.PaymentScreenShot)) {
        throw new Error('Add both product and payment images before saving.');
      }

      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('price', form.price);
      payload.append('quantity', normalizeQuantity(form.quantity));
      payload.append('finalPrice', form.finalPrice);
      payload.append('PriceGivenAdvance', form.PriceGivenAdvance);
      payload.append('status', form.status);

      if (form.image) {
        payload.append('image', form.image);
      }

      if (form.PaymentScreenShot) {
        payload.append('PaymentScreenShot', form.PaymentScreenShot);
      }

      const endpoint = editingProduct
        ? `${API_BASE_URL}/products/${editingProduct._id}`
        : `${API_BASE_URL}/products`;

      const response = await fetch(endpoint, {
        method: editingProduct ? 'PUT' : 'POST',
        body: payload,
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(data, 'Product could not be saved'));
      }

      setNotice(editingProduct ? 'Product updated successfully.' : 'Product added successfully.');
      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      quantity: product.quantity ?? 1,
      finalPrice: product.finalPrice ?? '',
      PriceGivenAdvance: product.PriceGivenAdvance ?? '',
      status: product.status || 'Shipped',
      image: null,
      PaymentScreenShot: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const shouldDelete = window.confirm('Delete this product from the tracker?');

    if (!shouldDelete) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(data, 'Product could not be deleted'));
      }

      setNotice('Product deleted.');
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Daraz seller workspace</p>
            <h1>Store Product Tracker</h1>
          </div>
          <button className="icon-button" type="button" onClick={fetchProducts} aria-label="Refresh products">
            <RefreshCw size={20} />
          </button>
        </header>

        <section className="summary-strip" aria-label="Store summary">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div className="metric" key={item.label} style={{ '--index': index }}>
                <span className="metric-icon">
                  <Icon size={19} />
                </span>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            );
          })}
        </section>

        <section className="editor-layout">
          <form className="product-form" key={formVersion} onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <p className="eyebrow">{editingProduct ? 'Update listing' : 'New listing'}</p>
                <h2>{editingProduct ? editingProduct.name : 'Add a product'}</h2>
              </div>
              {editingProduct && (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  <X size={17} />
                  Cancel
                </button>
              )}
            </div>

            <label className="field">
              <span>Product name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Wireless earbuds, watch, bag..."
                required
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Sale price</span>
                <input
                  min="0"
                  name="price"
                  onChange={handleChange}
                  placeholder="0"
                  required
                  type="number"
                  value={form.price}
                />
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  min="1"
                  name="quantity"
                  onChange={handleChange}
                  placeholder="1"
                  required
                  step="1"
                  type="number"
                  value={form.quantity}
                />
              </label>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Advance paid</span>
                <input
                  min="0"
                  name="PriceGivenAdvance"
                  onChange={handleChange}
                  placeholder="0"
                  required
                  type="number"
                  value={form.PriceGivenAdvance}
                />
              </label>
              <label className="field">
                <span>Final price</span>
                <input
                  min="0"
                  name="finalPrice"
                  onChange={handleChange}
                  placeholder="0"
                  required
                  type="number"
                  value={form.finalPrice}
                />
              </label>
            </div>

            <label className="field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleChange}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="upload-grid">
              <UploadBox
                icon={ImagePlus}
                label="Product image"
                name="image"
                preview={productPreview || editingProduct?.imageUrl}
                required={!editingProduct}
                onChange={handleChange}
              />
              <UploadBox
                icon={Camera}
                label="Payment screenshot"
                name="PaymentScreenShot"
                preview={paymentPreview || editingProduct?.PaymentScreenShot}
                required={!editingProduct}
                onChange={handleChange}
              />
            </div>

            {error && <div className="alert error">{error}</div>}
            {notice && <div className="alert success">{notice}</div>}

            <button className="primary-button" disabled={saving} type="submit">
              {saving ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
              {editingProduct ? 'Update product' : 'Add product'}
            </button>
          </form>

          <section className="inventory-panel">
            <div className="inventory-toolbar">
              <div>
                <p className="eyebrow">Inventory</p>
                <h2>{filteredProducts.length} products</h2>
              </div>
              <div className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product"
                />
              </div>
            </div>

            <div className="status-tabs" role="tablist" aria-label="Filter products by status">
              <button
                className={statusFilter === 'All' ? 'active' : ''}
                type="button"
                onClick={() => setStatusFilter('All')}
              >
                All
              </button>
              {statusOptions.map((status) => (
                <button
                  className={statusFilter === status.value ? 'active' : ''}
                  key={status.value}
                  type="button"
                  onClick={() => setStatusFilter(status.value)}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="empty-state">
                <PackageSearch size={36} />
                <strong>Loading products...</strong>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <PackageCheck size={36} />
                <strong>No products found</strong>
                <span>Add your first product or change the active filter.</span>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={index}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function UploadBox({ icon: Icon, label, name, onChange, preview, required }) {
  return (
    <label className="upload-box">
      <input accept="image/*" name={name} onChange={onChange} required={required} type="file" />
      {preview ? (
        <img alt="" src={preview} />
      ) : (
        <span className="upload-placeholder">
          <Icon size={25} />
          <span>{label}</span>
        </span>
      )}
      <span className="upload-caption">
        <Upload size={14} />
        {label}
      </span>
    </label>
  );
}

function ProductCard({ index = 0, product, onDelete, onEdit }) {
  const status = statusMeta[product.status] || statusMeta.Shipped;
  const Icon = status.icon;
  const quantity = quantityOf(product);
  const finalPrice = numeric(product.finalPrice);
  const profit = profitOf(product);

  return (
    <article className="product-card" style={{ '--index': index }}>
      <div className="product-media">
        <img alt={product.name} src={product.imageUrl} />
        <span className={`status-pill ${product.status}`}>
          <Icon size={14} />
          {status.label}
        </span>
      </div>

      <div className="product-body">
        <div>
          <h3>{product.name}</h3>
          <p>{quantity} units - Profit {money(profit)}</p>
        </div>

        <div className="money-row">
          <span>
            Unit price
            <strong>{money(product.price)}</strong>
          </span>
          <span>
            Advance
            <strong>{money(product.PriceGivenAdvance)}</strong>
          </span>
          <span>
            Final
            <strong>{money(finalPrice)}</strong>
          </span>
          <span>
            Profit
            <strong>{money(profit)}</strong>
          </span>
        </div>

        <div className="card-actions">
          <a className="ghost-button" href={product.PaymentScreenShot} target="_blank" rel="noreferrer">
            <Camera size={16} />
            Payment
          </a>
          <button className="icon-button" type="button" onClick={() => onEdit(product)} aria-label="Edit product">
            <Edit3 size={17} />
          </button>
          <button className="danger-button" type="button" onClick={() => onDelete(product._id)} aria-label="Delete product">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function useObjectUrl(file) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function numeric(value) {
  return Number(value) || 0;
}

function quantityOf(product) {
  return Math.max(1, Number(product.quantity) || 1);
}

function productValue(product) {
  const finalPrice = numeric(product.finalPrice);
  return finalPrice > 0 ? finalPrice : numeric(product.price) * quantityOf(product);
}

function profitOf(product) {
  return Math.abs(numeric(product.PriceGivenAdvance) - numeric(product.finalPrice));
}

function normalizeQuantity(value) {
  return String(Math.max(1, Math.floor(Number(value) || 1)));
}

function isImageFile(file) {
  return file.type.startsWith('image/') || imageExtensionPattern.test(file.name);
}

async function readApiResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: response.ok ? text : 'Server returned an unexpected response. Check the backend console.',
    };
  }
}

function formatApiError(data, fallback) {
  if (data?.message && data?.error) {
    return `${data.message}: ${data.error}`;
  }

  return data?.message || fallback;
}

function money(value) {
  return new Intl.NumberFormat('en-PK', {
    currency: 'PKR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(numeric(value));
}

createRoot(document.getElementById('root')).render(<App />);
