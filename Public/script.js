const {
  useState,
  useEffect,
  useMemo,
  Fragment,
} = React;
const {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} = ReactRouterDOM;

const STORAGE_KEYS = {
  users: "qr_users",
  session: "qr_session",
  bookings: "qr_bookings",
  draft: "qr_booking_draft",
  theme: "qr_theme",
};

const getStoredJSON = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const setStoredJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEYS.theme) || "light"
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  return [theme, setTheme];
};

const Navbar = ({ user, onLogout, theme, onToggleTheme }) => (
  <nav className="navbar navbar-expand-lg sticky-top app-navbar">
    <div className="container">
      <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
        <span className="brand-icon">
          <i className="bi bi-lightning-charge-fill"></i>
        </span>
        <span>QuickRide</span>
      </Link>
      <div className="ms-auto d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-icon"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          <i className={theme === "light" ? "bi bi-moon-stars" : "bi bi-sun"}></i>
        </button>
        {user ? (
          <Fragment>
            <Link className="btn btn-ghost" to="/dashboard">
              Dashboard
            </Link>
            <button className="btn btn-primary" onClick={onLogout}>
              Logout
            </button>
          </Fragment>
        ) : (
          <Fragment>
            <Link className="btn btn-ghost" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary" to="/register">
              Get Started
            </Link>
          </Fragment>
        )}
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="app-footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <h5>QuickRide</h5>
          <p>
            Premium ride booking with real-time estimates and a delightful
            experience.
          </p>
        </div>
        <div>
          <h6>Product</h6>
          <ul>
            <li>Ride options</li>
            <li>Business rides</li>
            <li>Safety center</li>
          </ul>
        </div>
        <div>
          <h6>Company</h6>
          <ul>
            <li>About</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <small>© 2024 QuickRide. All rights reserved.</small>
    </div>
  </footer>
);

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="auth-layout">
    <div className="auth-card">
      <div className="auth-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
    <div className="auth-visual">
      <div className="map-card">
        <div className="map-header">
          <span>Live City Grid</span>
          <span className="pill">Demo</span>
        </div>
        <div className="map-grid">
          <span className="pin pin-lg"></span>
          <span className="pin pin-sm"></span>
          <span className="pin pin-sm"></span>
          <span className="pin pin-lg"></span>
        </div>
      </div>
      <div className="visual-copy">
        <h3>Move smarter with QuickRide</h3>
        <p>
          Experience seamless bookings, clear pricing, and real-time driver
          updates—all in one app.
        </p>
      </div>
    </div>
  </div>
);

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (!form.identifier || !form.password) {
      setError("Enter your email/phone and password.");
      return;
    }
    const users = getStoredJSON(STORAGE_KEYS.users, []);
    const matched = users.find(
      (user) =>
        (user.email === form.identifier || user.phone === form.identifier) &&
        user.password === form.password
    );
    if (!matched) {
      setError("No account found. Try again or create a new one.");
      return;
    }
    onLogin(matched);
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage bookings, track rides, and plan your trips."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            id="loginIdentifier"
            placeholder="Email or phone"
            value={form.identifier}
            onChange={(event) =>
              setForm({ ...form, identifier: event.target.value })
            }
          />
          <label htmlFor="loginIdentifier">Email or phone</label>
        </div>
        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          <label htmlFor="loginPassword">Password</label>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
        <p className="auth-link">
          New to QuickRide? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

const RegisterPage = ({ onRegister }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.email || !form.password) {
      setError("Please complete all fields.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }

    const users = getStoredJSON(STORAGE_KEYS.users, []);
    if (users.some((user) => user.email === form.email)) {
      setError("An account with this email already exists.");
      return;
    }

    const newUser = { ...form, id: Date.now() };
    const updated = [...users, newUser];
    setStoredJSON(STORAGE_KEYS.users, updated);
    onRegister(newUser);
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join QuickRide to unlock faster bookings and curated rides."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            id="registerName"
            placeholder="Full name"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
          />
          <label htmlFor="registerName">Full name</label>
        </div>
        <div className="form-floating">
          <input
            type="tel"
            className="form-control"
            id="registerPhone"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
          <label htmlFor="registerPhone">Phone number</label>
        </div>
        <div className="form-floating">
          <input
            type="email"
            className="form-control"
            id="registerEmail"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
          <label htmlFor="registerEmail">Email</label>
        </div>
        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="registerPassword"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          <label htmlFor="registerPassword">Password</label>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <button type="submit" className="btn btn-primary w-100">
          Create account
        </button>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

const rideOptions = [
  {
    id: "mini",
    title: "Car · Mini",
    price: 8.5,
    eta: "2 min",
    distance: "3.2 km",
    icon: "bi bi-car-front-fill",
    tag: "Best value",
  },
  {
    id: "sedan",
    title: "Car · Sedan",
    price: 12.2,
    eta: "4 min",
    distance: "3.2 km",
    icon: "bi bi-car-front",
    tag: "Most popular",
  },
  {
    id: "suv",
    title: "Car · SUV",
    price: 18.6,
    eta: "6 min",
    distance: "3.2 km",
    icon: "bi bi-truck-front",
    tag: "Extra comfort",
  },
  {
    id: "bike",
    title: "Bike",
    price: 5.1,
    eta: "1 min",
    distance: "3.2 km",
    icon: "bi bi-bicycle",
    tag: "Fastest",
  },
];

const RideCard = ({ option, selected, onSelect }) => (
  <button
    type="button"
    className={`ride-card ${selected ? "selected" : ""}`}
    onClick={() => onSelect(option)}
  >
    <div className="ride-icon">
      <i className={option.icon}></i>
    </div>
    <div className="ride-details">
      <div className="ride-title">
        <span>{option.title}</span>
        <span className="badge-pill">{option.tag}</span>
      </div>
      <div className="ride-meta">
        <span>{option.distance}</span>
        <span>ETA {option.eta}</span>
      </div>
    </div>
    <div className="ride-price">${option.price.toFixed(2)}</div>
  </button>
);

const HomePage = ({ user }) => {
  const [pickup, setPickup] = useState("City Center Mall");
  const [drop, setDrop] = useState("Innovation Park");
  const [selected, setSelected] = useState(rideOptions[1]);
  const navigate = useNavigate();

  const handleContinue = () => {
    const draft = {
      pickup,
      drop,
      ride: selected,
      date: new Date().toISOString(),
      distance: selected.distance,
    };
    setStoredJSON(STORAGE_KEYS.draft, draft);
    navigate("/booking");
  };

  return (
    <main className="page page-home">
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="pill">QuickRide Prime</span>
            <h1>Book a ride in minutes, move with confidence.</h1>
            <p>
              Seamless pickups, upfront pricing, and real-time updates built for
              modern cities.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/booking">
                Book now
              </Link>
              <button className="btn btn-ghost" type="button">
                See pricing
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <h4>4.9★</h4>
                <p>Average rider rating</p>
              </div>
              <div>
                <h4>120+</h4>
                <p>Premium vehicles online</p>
              </div>
              <div>
                <h4>12m</h4>
                <p>Avg. pickup time</p>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="map-preview">
              <div className="map-grid">
                <span className="pin pin-lg"></span>
                <span className="pin pin-sm"></span>
                <span className="pin pin-sm"></span>
                <span className="pin pin-lg"></span>
              </div>
              <div className="map-footer">
                <span>
                  <i className="bi bi-geo-alt-fill"></i> 3.2 km · Midtown
                </span>
                <span className="status">
                  <span className="dot"></span> Drivers nearby
                </span>
              </div>
            </div>
            <div className="glass-info">
              <h5>Next ride</h5>
              <p>Premium sedan arriving in 4 min</p>
            </div>
          </div>
        </div>
      </section>

      <section className="booking-section">
        <div className="container booking-grid">
          <div className="booking-form">
            <h2>Plan your ride</h2>
            <p>Confirm pickup and destination to receive fare estimates.</p>
            <div className="input-group-lg">
              <label>Pickup location</label>
              <div className="input-icon">
                <i className="bi bi-geo-alt"></i>
                <input
                  type="text"
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                />
              </div>
            </div>
            <div className="input-group-lg">
              <label>Drop location</label>
              <div className="input-icon">
                <i className="bi bi-flag"></i>
                <input
                  type="text"
                  value={drop}
                  onChange={(event) => setDrop(event.target.value)}
                />
              </div>
            </div>
            <div className="info-panel">
              <span>
                <i className="bi bi-shield-check"></i> Safety first with SOS
              </span>
              <span>
                <i className="bi bi-credit-card"></i> Cashless payments enabled
              </span>
            </div>
          </div>
          <div className="ride-options">
            <div className="ride-options-header">
              <h3>Select your ride</h3>
              <span className="tag">{user ? `Hi, ${user.name}` : "Guest"}</span>
            </div>
            <div className="ride-list">
              {rideOptions.map((option) => (
                <RideCard
                  key={option.id}
                  option={option}
                  selected={selected?.id === option.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
            <button className="btn btn-primary w-100" onClick={handleContinue}>
              Continue to confirmation
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

const BookingPage = ({ user, onBookingConfirmed }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() =>
    getStoredJSON(STORAGE_KEYS.draft, null)
  );
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!draft) {
      setDraft({
        pickup: "City Center Mall",
        drop: "Innovation Park",
        ride: rideOptions[1],
        date: new Date().toISOString(),
        distance: "3.2 km",
      });
    }
  }, [draft]);

  const handleBook = () => {
    if (!draft) return;
    setStatus("loading");
    setTimeout(() => {
      const bookings = getStoredJSON(STORAGE_KEYS.bookings, []);
      const confirmed = {
        ...draft,
        id: Date.now(),
        status: "Confirmed",
        userId: user?.id || "guest",
      };
      setStoredJSON(STORAGE_KEYS.bookings, [confirmed, ...bookings]);
      setStoredJSON(STORAGE_KEYS.draft, null);
      setStatus("success");
      onBookingConfirmed?.(confirmed);
    }, 900);
  };

  if (!draft) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="page page-booking">
      <div className="container">
        <div className="booking-summary">
          <div className="summary-card">
            <h2>Confirm your ride</h2>
            <p>Review details before placing your booking.</p>
            <div className="summary-grid">
              <div>
                <span>Pickup</span>
                <strong>{draft.pickup}</strong>
              </div>
              <div>
                <span>Drop</span>
                <strong>{draft.drop}</strong>
              </div>
              <div>
                <span>Ride type</span>
                <strong>{draft.ride.title}</strong>
              </div>
              <div>
                <span>ETA</span>
                <strong>{draft.ride.eta}</strong>
              </div>
              <div>
                <span>Distance</span>
                <strong>{draft.distance}</strong>
              </div>
              <div>
                <span>Fare</span>
                <strong>${draft.ride.price.toFixed(2)}</strong>
              </div>
            </div>
            <div className="summary-actions">
              <button
                className="btn btn-primary"
                onClick={handleBook}
                disabled={status === "loading" || status === "success"}
              >
                {status === "loading" ? "Booking..." : "Book ride"}
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("/")}
              >
                Edit ride
              </button>
            </div>
            {status === "success" ? (
              <div className="alert alert-success mt-4">
                Ride booked! Your driver is on the way.
              </div>
            ) : null}
          </div>
          <div className="summary-side">
            <div className="status-card">
              <div>
                <h4>Driver arriving</h4>
                <p>Live tracking will appear once matched.</p>
              </div>
              <span className="pulse"></span>
            </div>
            <div className="support-card">
              <h5>Need assistance?</h5>
              <p>24/7 support via in-app chat and hotline.</p>
              <button className="btn btn-ghost">Contact support</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const DashboardPage = ({ user, onLogout }) => {
  const bookings = getStoredJSON(STORAGE_KEYS.bookings, []);
  const active = bookings.find((booking) => booking.status === "Confirmed");
  const history = bookings.slice(0, 4);

  return (
    <main className="page page-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h2>Welcome, {user?.name || "Rider"}</h2>
            <p>Track your latest rides and manage bookings.</p>
          </div>
          <button className="btn btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-grid">
          <div className="status-panel">
            <h4>Current booking</h4>
            {active ? (
              <div className="status-card large">
                <div>
                  <h5>{active.ride.title}</h5>
                  <p>
                    {active.pickup} → {active.drop}
                  </p>
                  <span className="pill">{active.status}</span>
                </div>
                <div>
                  <strong>${active.ride.price.toFixed(2)}</strong>
                  <span className="text-muted">ETA {active.ride.eta}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-calendar2-check"></i>
                <p>No active bookings. Plan a ride to get moving.</p>
                <Link className="btn btn-primary" to="/">
                  Book a ride
                </Link>
              </div>
            )}
          </div>
          <div className="history-panel">
            <h4>Ride history</h4>
            <div className="history-list">
              {history.length ? (
                history.map((ride) => (
                  <div key={ride.id} className="history-item">
                    <div>
                      <h6>{ride.ride.title}</h6>
                      <span>
                        {ride.pickup} → {ride.drop}
                      </span>
                    </div>
                    <div>
                      <strong>${ride.ride.price.toFixed(2)}</strong>
                      <small>{new Date(ride.date).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No rides yet. Book your first trip!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const App = () => {
  const [user, setUser] = useState(() =>
    getStoredJSON(STORAGE_KEYS.session, null)
  );
  const [theme, setTheme] = useTheme();

  const handleLogin = (account) => {
    setUser(account);
    setStoredJSON(STORAGE_KEYS.session, account);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.session);
  };

  const handleRegister = (account) => {
    handleLogin(account);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <HashRouter>
      <div className="app">
        <Navbar
          user={user}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route
            path="/login"
            element={<LoginPage onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onRegister={handleRegister} />}
          />
          <Route
            path="/booking"
            element={
              <BookingPage
                user={user}
                onBookingConfirmed={() => {
                  if (!user) return;
                }}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <DashboardPage user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
        <Footer />
      </div>
    </HashRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
