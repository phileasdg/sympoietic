(function() {
  let previousHash = window.location.hash;
  let lastTriggeredSlug = null;

  function wrapPhotoSwipe() {
    if (window.PhotoSwipe && !window.PhotoSwipe.isWrapped) {
      const OriginalPhotoSwipe = window.PhotoSwipe;
      window.PhotoSwipe = function(pswpElement, PhotoSwipeUI_Default, items, options) {
        const instance = new OriginalPhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        
        // Clear the #img- slug from the URL hash when PhotoSwipe is closed/destroyed
        instance.listen('destroy', function() {
          lastTriggeredSlug = null;
          if (window.location.hash.startsWith('#img-')) {
            if (history.replaceState) {
              history.replaceState('', document.title, window.location.pathname + window.location.search);
            } else {
              window.location.hash = '';
            }
          }
        });
        
        return instance;
      };
      window.PhotoSwipe.prototype = OriginalPhotoSwipe.prototype;
      window.PhotoSwipe.isWrapped = true;
    }
  }

  function handleHashChange() {
    wrapPhotoSwipe();

    // Prevent double-initialization if PhotoSwipe is already open
    const pswpEl = document.querySelector('.pswp');
    if (pswpEl && pswpEl.classList.contains('pswp--open')) {
      return;
    }

    const currentHash = window.location.hash;
    
    // Extract slugs to see if they refer to the same image
    const getSlug = (h) => {
      if (!h || !h.startsWith('#img-')) return null;
      return h.split('&')[0].substring(5);
    };

    const currentSlug = getSlug(currentHash);
    const previousSlug = getSlug(previousHash);

    const wasPhotoSwipeOpen = previousHash.includes('&gid=') || previousHash.includes('&pid=');
    const isPhotoSwipeOpenNow = currentHash.includes('&gid=') || currentHash.includes('&pid=');

    previousHash = currentHash;

    if (!currentSlug) {
      lastTriggeredSlug = null;
      return;
    }
    if (isPhotoSwipeOpenNow) return; // PhotoSwipe is already open/handling it
    
    // If PhotoSwipe was open, and we went back to the SAME image hash (e.g. closing PhotoSwipe)
    if (wasPhotoSwipeOpen && currentSlug === previousSlug) {
      return;
    }

    // Find all gallery item anchors
    const anchors = Array.from(document.querySelectorAll('.gallery__item a'));
    const targetAnchor = anchors.find(a => {
      const href = a.getAttribute('href');
      if (!href) return false;
      const parts = href.split('/');
      const lastPart = parts[parts.length - 1];
      const dotIndex = lastPart.lastIndexOf('.');
      const filename = dotIndex !== -1 ? lastPart.substring(0, dotIndex) : lastPart;
      return filename === currentSlug;
    });

    if (targetAnchor) {
      if (lastTriggeredSlug === currentSlug) {
        return;
      }
      lastTriggeredSlug = currentSlug;

      // Scroll into view
      targetAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash outline for visual focus
      const figure = targetAnchor.closest('.gallery__item');
      if (figure) {
        figure.style.outline = '3px solid #17BFA3';
        figure.style.transition = 'outline 0.3s ease';
        setTimeout(() => {
          figure.style.outline = 'transparent';
        }, 1500);
      }
      
      // Trigger PhotoSwipe click
      setTimeout(() => {
        targetAnchor.click();
      }, 300); // 300ms delay to let scroll transition start/finish smoothly
    }
  }

  // Bind to load and hashchange
  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('load', handleHashChange);
  
  if (document.readyState === 'complete') {
    handleHashChange();
  } else {
    document.addEventListener('DOMContentLoaded', handleHashChange);
  }

  // Dynamic page adjustments for Artist pages
  function initArtistPageAdjustments() {
    // 1. Move artist-bio (if any) before the gallery sections
    const bio = document.querySelector('.artist-bio');
    const sectionsContainer = document.querySelector('.artist-gallery-sections');
    if (bio && sectionsContainer) {
      sectionsContainer.parentNode.insertBefore(bio, sectionsContainer);
    }

    // 2. Hide empty cycles
    document.querySelectorAll('.gallery-stage-section').forEach(section => {
      const gallery = section.querySelector('.gallery');
      if (gallery && gallery.getAttribute('data-is-empty') === 'true') {
        section.style.display = 'none';
      }
    });

    // 3. Add link to highlight artist in the network visualizer
    const heroInner = document.querySelector('.artist-page-hero__inner');
    if (heroInner && !document.querySelector('.artist-page-hero__network-link')) {
      const path = window.location.pathname;
      const pageName = path.substring(path.lastIndexOf('/') + 1);
      
      const artistFileMap = {
        'sara-arango-franco.html': 'Arango_Franco_Sara',
        'gabriel-camacho-cabrera.html': 'Camacho_Cabrera_Gabriel',
        'kyle-thompson.html': 'Thompson_Kyle',
        'nadine-abd-el-razek.html': 'Nadine_AbdElRazek',
        'sonal-raghuvanshi.html': 'Sonal_Raghuvanshi',
        'lina-j-bulla-casas.html': 'Bulla_Lina',
        'phileas-dazeley-gaist-2.html': 'Phileas_Dazeley_Gaist',
        'ellynne-dec-2.html': 'elly',
        'louison-halgand.html': 'Louison_Halgand',
        'emerson-paquette.html': 'Emerson_Paquette'
      };

      const artistKey = artistFileMap[pageName];
      if (artistKey) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'artist-page-hero__network-link';
        linkContainer.style.marginTop = '1rem';
        
        const link = document.createElement('a');
        link.href = `../sympoietic-art-organism/?view=author&highlight=${artistKey}`;
        link.target = '_blank';
        link.className = 'btn';
        link.style.display = 'inline-block';
        link.style.width = 'auto';
        link.style.margin = '0';
        link.style.padding = '0.6rem 1.2rem';
        link.style.fontSize = '0.8rem';
        link.style.fontWeight = '600';
        link.style.background = 'transparent';
        link.style.border = '1px solid var(--color)';
        link.style.color = 'var(--color)';
        link.style.boxShadow = 'none';
        link.style.borderRadius = 'var(--border-radius)';
        link.style.textTransform = 'uppercase';
        link.style.letterSpacing = '0.05em';
        link.style.transition = 'all 0.2s ease';
        
        link.addEventListener('mouseenter', () => {
          link.style.background = 'var(--color)';
          link.style.color = 'var(--white)';
        });
        link.addEventListener('mouseleave', () => {
          link.style.background = 'transparent';
          link.style.color = 'var(--color)';
        });

        link.textContent = 'View in Network';
        linkContainer.appendChild(link);
        heroInner.appendChild(linkContainer);
      }
    }
  }

  // Bind to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArtistPageAdjustments);
  } else {
    initArtistPageAdjustments();
  }
})();
