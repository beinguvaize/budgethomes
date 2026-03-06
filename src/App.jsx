import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'

const BRAND = 'Budget Homes'

const sampleRooms = [
  { id: 'r1', title: 'Economy Twin', beds: 2, price: 59, features: ['Free Wi‑Fi', 'Heating'], img: 'https://picsum.photos/seed/r1/800/500' },
  { id: 'r2', title: 'Standard Double', beds: 1, price: 75, features: ['Free Wi‑Fi', 'TV'], img: 'https://picsum.photos/seed/r2/800/500' },
  { id: 'r3', title: 'Family Suite', beds: 3, price: 120, features: ['Kitchenette', 'Free Parking'], img: 'https://picsum.photos/seed/r3/800/500' },
]

function useLocalBookings() {
  const [bookings, setBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bh_bookings') || '[]') } catch (e) { return [] }
  })
  useEffect(() => { localStorage.setItem('bh_bookings', JSON.stringify(bookings)) }, [bookings])
  return [bookings, setBookings]
}

function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold">BH</div>
          <div>
            <div className="text-lg font-semibold">{BRAND}</div>
            <div className="text-xs text-slate-500">Affordable stays. Friendly service.</div>
          </div>
        </Link>

        <nav className="hidden md:flex gap-4 items-center">
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/booking">Book</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <Link to="/admin" className="px-3 py-2 rounded-md border border-slate-200 text-sm">Admin</Link>
        </nav>

        <div className="md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, children }) {
  return (<Link to={to} className="text-slate-700 hover:text-teal-600 text-sm">{children}</Link>)
}

function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button aria-expanded={open} onClick={() => setOpen(s => !s)} className="p-2 rounded-md border">Menu</button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md p-3">
          <Link to="/rooms" onClick={() => setOpen(false)} className="block py-1">Rooms</Link>
          <Link to="/booking" onClick={() => setOpen(false)} className="block py-1">Book</Link>
          <Link to="/about" onClick={() => setOpen(false)} className="block py-1">About</Link>
          <Link to="/contact" onClick={() => setOpen(false)} className="block py-1">Contact</Link>
        </div>
      )}
    </div>
  )
}

function Home() {
  return (
    <main>
      <section className="bg-gradient-to-r from-teal-50 to-white py-12">
        <div className="container grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome to {BRAND}</h1>
            <p className="mt-3 text-slate-700">Clean, simple rooms at fair prices. Centrally located with friendly staff — perfect for short stays and budget travellers.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/rooms" className="px-4 py-2 rounded-md bg-teal-500 text-white">See Rooms</Link>
              <Link to="/booking" className="px-4 py-2 rounded-md border">Book Now</Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Feature icon="🏷️" title="Low rates" text="Transparent pricing with no surprises." />
              <Feature icon="📶" title="Free Wi‑Fi" text="High-speed internet included." />
              <Feature icon="🧼" title="Clean rooms" text="Daily cleaning and fresh linen." />
              <Feature icon="🚗" title="Parking" text="Free on-site parking where available." />
            </div>
          </div>

          <div>
            <img alt="Clean and modern economy twin room at Budget Homes" src="https://picsum.photos/seed/hero/900/600" className="rounded-md shadow-md" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-semibold">Featured Rooms</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleRooms.map(r => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex gap-3 items-start bg-white p-3 rounded-md shadow-sm">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-slate-500">{text}</div>
      </div>
    </div>
  )
}

function RoomCard({ room }) {
  return (
    <article className="bg-white rounded-md shadow-sm overflow-hidden">
      <img src={room.img} alt={room.title} className="w-full h-40 object-cover" />
      <div className="p-3">
        <h3 className="font-semibold">{room.title}</h3>
        <div className="text-xs text-slate-500">{room.features.join(' • ')}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-bold">${room.price}/night</div>
          <Link to={`/booking?room=${room.id}`} className="px-3 py-1 rounded-md border text-sm">Book</Link>
        </div>
      </div>
    </article>
  )
}

function Rooms() {
  const [q, setQ] = useState('')
  const filtered = sampleRooms.filter(r => r.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="py-12 container">
      <h2 className="text-2xl font-semibold">Rooms</h2>
      <div className="mt-4 flex gap-3 items-center">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search rooms" className="border rounded-md px-3 py-2 w-full md:w-64" />
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(r => <RoomCard key={r.id} room={r} />)}
      </div>
    </div>
  )
}

function Booking() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useLocalBookings()
  const params = new URLSearchParams(window.location.search)
  const preRoom = params.get('room')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', room: preRoom || sampleRooms[0].id, checkin: '', checkout: '', guests: 1, notes: ''
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function submit(e) {
    e.preventDefault()
    const id = 'B' + Date.now()
    const payload = { ...form, id, createdAt: new Date().toISOString() }
    setBookings(prev => [payload, ...prev])
    alert('Booking received — saved locally. For a real site connect to a backend or email service.')
    navigate('/admin')
  }

  return (
    <div className="py-12 container">
      <h2 className="text-2xl font-semibold">Make a Booking</h2>
      <form onSubmit={submit} className="mt-6 grid md:grid-cols-2 gap-4">
        <input required name="name" value={form.name} onChange={handleChange} placeholder="Full name" className="border rounded-md px-3 py-2" />
        <input required name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="border rounded-md px-3 py-2" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="border rounded-md px-3 py-2" />

        <select name="room" value={form.room} onChange={handleChange} className="border rounded-md px-3 py-2">
          {sampleRooms.map(r => <option key={r.id} value={r.id}>{r.title} — ${r.price}/night</option>)}
        </select>

        <input name="checkin" value={form.checkin} onChange={handleChange} type="date" className="border rounded-md px-3 py-2" />
        <input name="checkout" value={form.checkout} onChange={handleChange} type="date" className="border rounded-md px-3 py-2" />

        <input name="guests" value={form.guests} onChange={handleChange} type="number" min="1" className="border rounded-md px-3 py-2" />

        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="border rounded-md px-3 py-2 md:col-span-2" />

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" className="px-4 py-2 rounded-md bg-teal-500 text-white">Send Booking</button>
          <button type="button" onClick={() => { setForm({ name: '', email: '', phone: '', room: sampleRooms[0].id, checkin: '', checkout: '', guests: 1, notes: '' }) }} className="px-4 py-2 rounded-md border">Reset</button>
        </div>
      </form>
    </div>
  )
}

function Admin() {
  const [bookings, setBookings] = useLocalBookings()

  function cancel(id) {
    if (!confirm('Delete booking?')) return
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="py-12 container">
      <h2 className="text-2xl font-semibold">Bookings (local)</h2>
      <div className="mt-4">
        {bookings.length === 0 && <div className="text-slate-500">No bookings yet. Use the booking form to create one (saved to your browser localStorage).</div>}
        <ul className="mt-4 space-y-3">
          {bookings.map(b => (
            <li key={b.id} className="p-3 border rounded-md bg-white flex items-start justify-between">
              <div>
                <div className="font-semibold">{b.name} — <span className="text-xs text-slate-500">{b.email}</span></div>
                <div className="text-xs text-slate-500">{b.room} • {b.checkin} → {b.checkout} • guests: {b.guests}</div>
                {b.notes && <div className="mt-2 text-sm">Notes: {b.notes}</div>}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => cancel(b.id)} className="px-2 py-1 rounded-md border text-sm">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="py-12 container">
      <h2 className="text-2xl font-semibold">About {BRAND}</h2>
      <p className="mt-4 text-slate-700">Budget Homes is a friendly, no-frills lodging option created for travellers who want reliable accommodation without premium prices. We focus on cleanliness, safety, and helpful service.</p>
    </div>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  function submit(e) { e.preventDefault(); setSent(true); }
  return (
    <div className="py-12 container">
      <h2 className="text-2xl font-semibold">Contact</h2>
      <form onSubmit={submit} className="mt-6 grid md:grid-cols-2 gap-4">
        <input required placeholder="Name" className="border rounded-md px-3 py-2" />
        <input required placeholder="Email" type="email" className="border rounded-md px-3 py-2" />
        <textarea placeholder="Message" className="border rounded-md px-3 py-2 md:col-span-2" />
        <div className="md:col-span-2">
          <button className="px-4 py-2 rounded-md bg-teal-500 text-white">Send</button>
          {sent && <div className="mt-2 text-sm text-teal-600">Message saved locally — in production you'd forward this to the hotel's email.</div>}
        </div>
      </form>

      <div className="mt-8">
        <h3 className="font-semibold">Location</h3>
        <p className="text-sm text-slate-500">123 Budget Street, Your City — near downtown transport.</p>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-50 py-8 mt-12">
      <div className="container text-sm text-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>© {new Date().getFullYear()} {BRAND}. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  )
}

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": BRAND,
    "description": "Affordable, clean, and centrally located accommodation.",
    "url": "https://www.bhomesindia.com/",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Budget Street",
      "addressLocality": "Your City",
      "addressRegion": "NS",
      "postalCode": "B3J 1A1",
      "addressCountry": "CA"
    },
    "telephone": "+1-902-555-0123",
    "priceRange": "$",
    "image": "https://picsum.photos/seed/hero/900/600",
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "Free Wi-Fi", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Free Parking", "value": true }
    ]
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': `${BRAND} | Affordable Stays & Friendly Service`,
      '/rooms': `Rooms | ${BRAND}`,
      '/booking': `Book Your Stay | ${BRAND}`,
      '/about': `About Us | ${BRAND}`,
      '/contact': `Contact Us | ${BRAND}`,
      '/admin': `Admin Portal | ${BRAND}`
    };
    document.title = titles[location.pathname] || BRAND;

    // Update canonical link
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', `https://www.bhomesindia.com${location.pathname === '/' ? '' : location.pathname}`);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <StructuredData />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer />
    </div>
  )
}
