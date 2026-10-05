import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  FolderUp,
  Github,
  Instagram,
  Linkedin,
  LoaderCircle,
  Menu,
  MoveUpRight,
  Play,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type MediaItem = {
  id: string;
  file_name: string;
  storage_path: string;
  media_type: 'image' | 'video';
  created_at: string;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const focusAreas = [
  { number: '01', title: 'Transportation', text: 'Designing movement systems that connect people to opportunity.' },
  { number: '02', title: 'Water + Wastewater', text: 'Protecting the invisible infrastructure every community depends on.' },
  { number: '03', title: 'Environmental sustainability', text: 'Building a future where progress and the planet move together.' },
  { number: '04', title: 'Structures + automation', text: 'Curious about the mechanics, materials, and machines behind better ideas.' },
];

const journey = [
  { year: '2026', label: 'Now', title: 'Fourth-year Civil & Environmental Engineering student', detail: 'University of Alberta' },
  { year: '2024', label: 'Community', title: 'Black Engineering Students Association', detail: 'University of Alberta' },
  { year: 'Next', label: 'Always', title: 'Learning by building, asking, and showing up', detail: 'With purpose' },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    void loadMedia();
  }, []);

  async function loadMedia(): Promise<void> {
    setLoadingMedia(true);
    const { data } = await supabase
      .from('portfolio_media')
      .select('id, file_name, storage_path, media_type, created_at')
      .order('created_at', { ascending: false });
    setMedia(data ?? []);
    setLoadingMedia(false);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    const invalidFile = files.find((file) => file.size > 50 * 1024 * 1024);
    if (invalidFile) {
      setUploadMessage('Each file must be smaller than 50 MB.');
      return;
    }

    setUploading(true);
    setUploadMessage('');
    let uploadedCount = 0;

    for (const file of files) {
      const mediaType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null;
      if (!mediaType) continue;

      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const storagePath = `${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('portfolio-media').upload(storagePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) continue;

      const { error: rowError } = await supabase.from('portfolio_media').insert({
        file_name: file.name,
        storage_path: storagePath,
        media_type: mediaType,
      });

      if (rowError) {
        await supabase.storage.from('portfolio-media').remove([storagePath]);
        continue;
      }
      uploadedCount += 1;
    }

    setUploading(false);
    setUploadMessage(uploadedCount ? `${uploadedCount} ${uploadedCount === 1 ? 'memory' : 'memories'} added to the gallery.` : 'That upload could not be added. Please try another file.');
    await loadMedia();
  }

  async function handleDelete(item: MediaItem): Promise<void> {
    const { error: storageError } = await supabase.storage.from('portfolio-media').remove([item.storage_path]);
    if (storageError) return;
    await supabase.from('portfolio_media').delete().eq('id', item.id);
    setMedia((current) => current.filter((entry) => entry.id !== item.id));
    setLightboxItem(null);
  }

  function publicUrl(item: MediaItem): string {
    return supabase.storage.from('portfolio-media').getPublicUrl(item.storage_path).data.publicUrl;
  }

  const featuredMedia = useMemo(() => media.slice(0, 6), [media]);

  return (
    <main>
      <nav className="site-nav" aria-label="Main navigation">
        <a href="#top" className="wordmark" onClick={() => setMenuOpen(false)}>
          <span>FB</span>
          <small>Portfolio / 2026</small>
        </a>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#focus" onClick={() => setMenuOpen(false)}>Focus areas</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="#connect" className="nav-contact" onClick={() => setMenuOpen(false)}>Let's connect <ArrowUpRight size={15} /></a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Civil + Environmental Engineering</p>
          <h1>Building with<br /><em>intention.</em></h1>
          <p className="hero-intro">Frances Braimah is a fourth-year engineering student at the University of Alberta, curious about the systems that make a better world possible.</p>
          <a className="text-link" href="#about">Get to know me <ArrowDownRight size={17} /></a>
        </div>
        <div className="hero-portrait-wrap">
          <div className="hero-portrait-frame" />
          <img className="hero-portrait" src="/assets/images/photo_2026-10-05_16-33-10.jpg" alt="Frances Braimah smiling outdoors" />
          <div className="portrait-caption"><span>Edmonton, AB</span><span>53° 32' N</span></div>
        </div>
        <div className="hero-stamp"><Sparkles size={18} /><span>People<br />Planet<br />Possibility</span></div>
        <a className="scroll-cue" href="#about"><span>Scroll to explore</span><ChevronDown size={18} /></a>
      </section>

      <section className="about-section section-shell" id="about">
        <div className="section-kicker"><span>01</span><span>My perspective</span></div>
        <div className="about-grid">
          <div className="about-heading"><p className="display-small">Engineering<br /><em>is a mindset.</em></p><div className="line-arrow"><ArrowDownRight size={30} /></div></div>
          <div className="about-copy">
            <p className="lead">Engineering is more than a degree. It is a mindset, a responsibility, and a way of shaping the world with purpose.</p>
            <p>I study Civil Engineering with a focus on Environmental Engineering because I care about creating solutions that protect both people and the Earth. Every system, every structure, every decision should serve today&apos;s needs while leaving room for tomorrow&apos;s possibilities.</p>
            <p>My interests move across disciplines — from transportation and wastewater to structural engineering, machine design, automation, and the endlessly human world of biomedicine.</p>
            <a className="round-link" href="#focus" aria-label="Explore focus areas"><ArrowDownRight size={20} /></a>
          </div>
        </div>
      </section>

      <section className="statement-band">
        <div className="section-shell statement-inner"><span className="quote-mark">“</span><p>How can we make the systems around us more thoughtful, more resilient, and more alive?</p><span className="quote-credit">— Frances</span></div>
      </section>

      <section className="focus-section section-shell" id="focus">
        <div className="section-kicker"><span>02</span><span>Where curiosity leads</span></div>
        <div className="focus-header"><p className="display-medium">A wide lens.<br /><em>A clear purpose.</em></p><p className="focus-note">The best ideas often live between disciplines. These are the spaces I keep returning to.</p></div>
        <div className="focus-list">
          {focusAreas.map((area) => <article className="focus-item" key={area.number}><span className="focus-number">{area.number}</span><h3>{area.title}</h3><p>{area.text}</p><ArrowUpRight className="focus-icon" size={22} /></article>)}
        </div>
      </section>

      <section className="journey-section section-shell">
        <div className="section-kicker"><span>03</span><span>In motion</span></div>
        <div className="journey-grid"><p className="display-small">Still becoming<br /><em>the engineer I am.</em></p><div className="journey-list">{journey.map((item) => <div className="journey-item" key={item.year}><span className="journey-year">{item.year}</span><div><span className="journey-label">{item.label}</span><h3>{item.title}</h3><p>{item.detail}</p></div><MoveUpRight size={19} /></div>)}</div></div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-shell">
          <div className="section-kicker light"><span>04</span><span>Life in frames</span></div>
          <div className="gallery-header"><div><p className="display-medium light-text">The work, the joy,<br /><em>the in-between.</em></p><p className="gallery-subtitle">A living collection of the people, places, and moments that shape my journey.</p></div><label className="upload-button"><input type="file" accept="image/*,video/*" multiple onChange={handleUpload} disabled={uploading} />{uploading ? <LoaderCircle className="spin" size={18} /> : <FolderUp size={18} />}<span>{uploading ? 'Adding memories…' : 'Add photos or videos'}</span></label></div>
          {uploadMessage && <div className="upload-message"><Check size={16} />{uploadMessage}</div>}
          {loadingMedia ? <div className="gallery-empty"><LoaderCircle className="spin" size={25} /><span>Opening the gallery…</span></div> : featuredMedia.length ? <div className="gallery-grid">{featuredMedia.map((item) => <button className="media-card" key={item.id} type="button" onClick={() => setLightboxItem(item)}>{item.media_type === 'video' ? <video src={publicUrl(item)} muted preload="metadata" /> : <img src={publicUrl(item)} alt={item.file_name} />}{item.media_type === 'video' && <span className="video-badge"><Play size={13} fill="currentColor" /></span>}<span className="media-name">{item.file_name}</span></button>)}</div> : <div className="gallery-empty"><Camera size={25} /><span>Your gallery is ready for its first memory.</span><small>Use the button above to add a photo or video.</small></div>}
        </div>
      </section>

      <section className="connect-section section-shell" id="connect">
        <div className="connect-top"><div className="section-kicker"><span>05</span><span>Open to possibility</span></div><p className="connect-note">Whether you want to talk engineering, sustainability, design, or the next big question — I&apos;d love to hear from you.</p></div>
        <div className="connect-bottom"><p className="display-large">Let&apos;s make<br /><em>something matter.</em></p><a className="email-link" href="mailto:frances.braimah@example.com">frances.braimah@example.com <ArrowUpRight size={22} /></a></div>
        <footer><span>Frances Braimah © 2026</span><span className="footer-center">Built with purpose.</span><div className="social-links"><a href="#connect" aria-label="LinkedIn"><Linkedin size={18} /></a><a href="#connect" aria-label="Instagram"><Instagram size={18} /></a><a href="#connect" aria-label="GitHub"><Github size={18} /></a></div></footer>
      </section>

      {lightboxItem && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Media viewer" onClick={() => setLightboxItem(null)}><button className="close-lightbox" type="button" aria-label="Close media viewer" onClick={() => setLightboxItem(null)}><X size={22} /></button><div className="lightbox-content" onClick={(event) => event.stopPropagation()}>{lightboxItem.media_type === 'video' ? <video src={publicUrl(lightboxItem)} controls autoPlay /> : <img src={publicUrl(lightboxItem)} alt={lightboxItem.file_name} />}<div className="lightbox-footer"><span>{lightboxItem.file_name}</span><button type="button" onClick={() => void handleDelete(lightboxItem)}><Trash2 size={16} /> Remove</button></div></div></div>}
    </main>
  );
}

export default App;
