/* ============================================================
   ROYAL HERITAGE RESORT — Blog.js
   ============================================================
   Serves as a mock database/handler for blog posts.
   Will fetch from Firestore in future updates, currently
   renders structured local posts safely (XSS-free).
   ============================================================ */

'use strict';

const Blog = (() => {

  const posts = {
    'things-to-do': {
      title: '10 Things to Do Near Royal Heritage Resort',
      category: 'Local Guide',
      date: 'June 28, 2026',
      author: 'Aarav Gupta',
      image: 'assets/images/hero.png',
      tags: ['Local Guide', 'Sightseeing', 'Adventure'],
      content: [
        { type: 'p', text: 'Royal Heritage Resort is situated in a region rich in cultural history, vibrant landscapes, and natural beauty. While the resort itself is a sanctuary of peace, stepping outside offers a treasure trove of experiences waiting to be discovered.' },
        { type: 'h2', text: '1. Hike to the Whispering Waterfalls' },
        { type: 'p', text: 'Just a 20-minute guided trek from our main gate, the Whispering Waterfalls is a local hidden gem. Surrounded by dense foliage and mossy rock faces, it is the perfect spot for an early morning picnic or a refreshing dip in the crystal clear plunge pool.' },
        { type: 'h2', text: '2. Visit the Ancient Temple of Sun' },
        { type: 'p', text: 'A short 15km drive away lies the 10th-century Surya Mandir. Built with intricately carved local sandstone, this architectural marvel stands as a testament to historical craftsmanship. Visited during sunrise, the temple glows in a beautiful golden hue.' },
        { type: 'h2', text: '3. Explore the Spice Plantations' },
        { type: 'p', text: 'Take a guided tour of the organic spice plantations nearby. Breathe in the rich scents of cardamom, cloves, black pepper, and cinnamon, and learn how these essential flavors are grown and harvested.' }
      ],
      faqs: [
        { q: 'How far are the Whispering Waterfalls from the resort?', a: 'The Whispering Waterfalls is a 1.5 km hike from the resort, taking approximately 20-25 minutes through a scenic forest trail.' },
        { q: 'Are guided tours available to Surya Mandir?', a: 'Yes, our concierge desk can arrange private day tours to Surya Mandir with local historians as guides.' }
      ]
    },
    'ayurvedic-healing': {
      title: 'The Ancient Art of Ayurvedic Healing at Our Spa',
      category: 'Wellness',
      date: 'June 15, 2026',
      author: 'Dr. Ananya Rao',
      image: 'assets/images/spa.png',
      tags: ['Spa', 'Wellness', 'Ayurveda'],
      content: [
        { type: 'p', text: 'Ayurveda, the sister science of yoga, is a 5,000-year-old system of natural healing originating in India. At the Royal Heritage Spa, we honor these time-tested traditions by blending ancient therapies with contemporary wellness needs.' },
        { type: 'h2', text: 'Understanding Your Doshas' },
        { type: 'p', text: 'According to Ayurveda, every individual is comprised of a unique combination of three vital energies or doshas: Vata, Pitta, and Kapha. Our treatments begin with a personalized assessment to identify your current imbalances and tailor the session accordingly.' },
        { type: 'h2', text: 'Signature Therapy: Abhyanga' },
        { type: 'p', text: 'Our signature Abhyanga massage is a full-body therapy performed with warm, herb-infused sesame oil. Moving in rhythmic strokes, our therapists work to stimulate lymphatic flow, release muscle tension, and soothe the nervous system.' }
      ],
      faqs: [
        { q: 'What should I wear for an Ayurvedic treatment?', a: 'We recommend comfortable clothing. We provide disposable undergarments, robes, and slippers for use during your spa visit.' },
        { q: 'Is consultation required before booking a spa session?', a: 'While not mandatory, we recommend arriving 15 minutes early for a brief lifestyle consultation with our in-house Ayurvedic doctor.' }
      ]
    },
    'farm-to-table': {
      title: 'Farm to Table: Our Kitchen Garden Story',
      category: 'Dining',
      date: 'June 2, 2026',
      author: 'Chef Ranveer Singh',
      image: 'assets/images/dining.png',
      tags: ['Dining', 'Organic', 'Recipes'],
      content: [
        { type: 'p', text: 'At Royal Heritage Resort, we believe that great food starts with honest ingredients. Our farm-to-table philosophy is not just a marketing phrase — it is a daily commitment to serving clean, organic, and locally sourced food.' },
        { type: 'h2', text: 'Our Organic Oasis' },
        { type: 'p', text: 'Our kitchen garden spans over half an acre of fertile land on the resort grounds. Here, our gardening team cultivates a wide range of seasonal vegetables, heritage grains, fresh herbs, and edible flowers.' },
        { type: 'h2', text: 'Harvesting Daily' },
        { type: 'p', text: 'Every morning, our kitchen team harvests fresh herbs and salad greens to be used in that day’s lunch and dinner menus. What we do not grow ourselves is sourced directly from certified organic farms in the surrounding villages, supporting local agriculture.' }
      ],
      faqs: [
        { q: 'Can guests visit the organic kitchen garden?', a: 'Yes! We host guided kitchen garden walks every evening at 4:30 PM, where guests can learn about organic farming and pick their own herbs.' },
        { q: 'Do you offer vegan or gluten-free options?', a: 'Yes, a large portion of our menu features vegan and gluten-free choices, and our chefs are happy to adapt dishes based on dietary restrictions.' }
      ]
    },
    'glamping-trend': {
      title: 'Why Glamping is the New Luxury Travel Trend',
      category: 'Experience',
      date: 'May 20, 2026',
      author: 'Raghav Bhatia',
      image: 'assets/images/tent.png',
      tags: ['Glamping', 'Luxury', 'Nature'],
      content: [
        { type: 'p', text: 'Glamping, or glamorous camping, has taken the travel world by storm. It represents the perfect bridge for those who wish to disconnect in nature without losing the creature comforts of a high-end luxury hotel room.' },
        { type: 'h2', text: 'Close to Nature, Closer to Comfort' },
        { type: 'p', text: 'Unlike traditional camping, our Royal Safari Tents feature solid wood floors, en-suite tiled bathrooms with hot running water, plush king-size beds with premium linens, and private veranda space to sit and enjoy your morning tea.' },
        { type: 'h2', text: 'A Sensory Disconnect' },
        { type: 'p', text: 'Sleeping under canvas is a unique sensory experience. Hearing the gentle rustle of leaves, the sound of rain on the canopy, and waking up to panoramic views of rolling hills is something a standard brick-and-mortar hotel suite simply cannot replicate.' }
      ],
      faqs: [
        { q: 'Are the tents weather-proof?', a: 'Yes, our tents are custom-built with high-grade, multi-layered waterproof and windproof canvas, ensuring total comfort in all seasons.' },
        { q: 'Is there heating/cooling in the tents?', a: 'Yes, all our luxury tents are equipped with quiet climate control units (AC and heating) to maintain comfortable temperatures.' }
      ]
    },
    'heritage-cottages': {
      title: 'The Story Behind Our Heritage Stone Cottages',
      category: 'Heritage',
      date: 'May 5, 2026',
      author: 'Vikram Dev',
      image: 'assets/images/cottage.png',
      tags: ['Cottages', 'Heritage', 'Architecture'],
      content: [
        { type: 'p', text: 'Our Heritage Stone Cottages are more than just guest rooms — they are architectural tributes to the historical craftsmanship of this region. Every stone was sourced locally, and every beam was crafted by local hands.' },
        { type: 'h2', text: 'Traditional Craftsmanship' },
        { type: 'p', text: 'We collaborated with local stonemasons to build these structures using dry-stack appearance stone walls that blend seamlessly into the hilly landscape. The wooden rafters and doors are carved from reclaimed local teak, preserving resources while adding authentic historic character.' },
        { type: 'h2', text: 'Modern Comfort with Rustic Charm' },
        { type: 'p', text: 'Inside, guests are greeted by cozy fireplaces, traditional clay tile detailing, and warm, indirect lighting. The private garden porches offer a serene space to read, relax, or simply watch the clouds drift over the mountains.' }
      ],
      faqs: [
        { q: 'Do the cottages have fireplaces?', a: 'Yes, all our Heritage Stone Cottages feature working wood-burning fireplaces, which our staff can light for you on cool evenings.' },
        { q: 'How many people can fit in a cottage?', a: 'Each cottage can comfortably accommodate up to 3 adults, or 2 adults and 2 children, with extra bedding options available.' }
      ]
    },
    'monsoon-magic': {
      title: 'Monsoon Magic: Why Rainy Season is the Best Time to Visit',
      category: 'Seasonal',
      date: 'April 18, 2026',
      author: 'Sarah Jenkins',
      image: 'assets/images/pool.png',
      tags: ['Monsoon', 'Seasons', 'Travel Tips'],
      content: [
        { type: 'p', text: 'While summer and winter are popular times to travel, the monsoon season brings a unique, magical transformation to our resort region. It is a time when nature is at its most vibrant, lush, and alive.' },
        { type: 'h2', text: 'A Landscape in Technicolor' },
        { type: 'p', text: 'As the rains arrive, the surrounding hills turn an intense, vibrant green. Waterfalls that remain dry during the summer roar to life, and misty clouds descend to float gently through the resort paths, creating an ethereal, dreamlike atmosphere.' },
        { type: 'h2', text: 'The Perfect Indoor Coziness' },
        { type: 'p', text: 'There is nothing quite like listening to the rhythmic drum of rain on canvas while staying warm inside a luxury tent, or sitting by a crackling fireplace in a stone cottage with a cup of hot spiced tea. It is the ultimate season for relaxation and introspection.' }
      ],
      faqs: [
        { q: 'What activities are available during the monsoon?', a: 'While some outdoor rock climbing is suspended, monsoon hikes, spice garden walks, spa therapies, cooking classes, and stargazing (when clouds clear) remain popular.' },
        { q: 'Is it safe to travel to the resort in heavy rain?', a: 'Yes, all our roads are concrete and well-drained. The resort is fully prepared with backup generators, storm drainage, and emergency response plans.' }
      ]
    }
  };

  /* ─── Render Single Blog Post ─── */
  function renderPost() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) return;

    const post = posts[slug];
    if (!post) {
      document.title = 'Post Not Found — Royal Heritage Resort';
      const container = document.querySelector('.blog-post-container');
      if (container) {
        container.innerHTML = ''; // Safe because it's static structure replacement
        const errorMsg = document.createElement('div');
        errorMsg.style.textAlign = 'center';
        errorMsg.style.padding = '4rem 0';
        
        const h1 = document.createElement('h1');
        h1.textContent = 'Article Not Found';
        h1.style.fontFamily = 'var(--font-display)';
        h1.style.marginBottom = '1.5rem';
        
        const p = document.createElement('p');
        p.textContent = 'The article you are looking for does not exist or has been moved.';
        p.style.marginBottom = '2rem';
        p.style.color = 'var(--text-secondary)';

        const a = document.createElement('a');
        a.href = 'blog.html';
        a.className = 'btn btn-primary';
        a.textContent = 'Return to Journal';

        errorMsg.appendChild(h1);
        errorMsg.appendChild(p);
        errorMsg.appendChild(a);
        container.appendChild(errorMsg);
      }
      return;
    }

    // Set page titles and metadata safely
    document.title = `${post.title} — The Journal | Royal Heritage Resort`;
    
    const breadcrumb = document.getElementById('breadcrumb-post-title');
    const title = document.getElementById('post-title');
    const category = document.getElementById('post-category');
    const date = document.getElementById('post-date');
    const author = document.getElementById('post-author');
    const image = document.getElementById('post-image');
    const content = document.getElementById('post-content');
    const tags = document.getElementById('post-tags');
    const faqAccordion = document.getElementById('post-faq-accordion');

    if (breadcrumb) breadcrumb.textContent = post.title;
    if (title) title.textContent = post.title;
    if (category) category.textContent = post.category;
    if (date) date.textContent = post.date;
    if (author) author.textContent = `By ${post.author}`;
    if (image) {
      image.src = post.image;
      image.alt = post.title;
    }

    // SECURITY: Render contents using safe DOM creation to prevent XSS
    if (content) {
      content.textContent = ''; // Clear loading message
      post.content.forEach(chunk => {
        if (chunk.type === 'p') {
          const p = document.createElement('p');
          p.textContent = chunk.text;
          content.appendChild(p);
        } else if (chunk.type === 'h2') {
          const h2 = document.createElement('h2');
          h2.style.fontFamily = 'var(--font-display)';
          h2.style.fontSize = 'var(--fs-h3)';
          h2.style.fontWeight = 'var(--fw-bold)';
          h2.style.marginTop = 'var(--space-10)';
          h2.style.marginBottom = 'var(--space-4)';
          h2.style.lineHeight = 'var(--lh-tight)';
          h2.textContent = chunk.text;
          content.appendChild(h2);
        }
      });
    }

    // SECURITY: Render tags safely
    if (tags) {
      tags.textContent = '';
      post.tags.forEach(tagText => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-gold';
        badge.textContent = tagText;
        tags.appendChild(badge);
      });
    }

    // SECURITY: Render FAQs safely for AEO benefits
    if (faqAccordion && post.faqs) {
      faqAccordion.textContent = '';
      post.faqs.forEach((faq, index) => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.id = `post-faq-${index}`;

        const button = document.createElement('button');
        button.className = 'faq-question';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `post-faq-answer-${index}`);

        const h3 = document.createElement('h3');
        h3.style.fontFamily = 'var(--font-display)';
        h3.style.fontSize = 'var(--fs-h5)';
        h3.style.fontWeight = 'var(--fw-bold)';
        h3.style.margin = '0';
        h3.textContent = faq.q;

        const icon = document.createElement('span');
        icon.className = 'faq-icon';
        icon.textContent = '+';

        button.appendChild(h3);
        button.appendChild(icon);

        const answerDiv = document.createElement('div');
        answerDiv.className = 'faq-answer';
        answerDiv.id = `post-faq-answer-${index}`;
        answerDiv.style.maxHeight = '0';
        answerDiv.style.overflow = 'hidden';
        answerDiv.style.transition = 'max-height var(--duration-slow) var(--ease-out)';

        const innerDiv = document.createElement('div');
        innerDiv.className = 'faq-answer-inner';
        innerDiv.style.padding = '0 0 var(--space-6) 0';
        innerDiv.style.color = 'var(--text-secondary)';
        innerDiv.style.lineHeight = 'var(--lh-relaxed)';
        innerDiv.textContent = faq.a;

        answerDiv.appendChild(innerDiv);
        faqItem.appendChild(button);
        faqItem.appendChild(answerDiv);
        faqAccordion.appendChild(faqItem);

        // Click handler
        button.addEventListener('click', function() {
          const wasActive = faqItem.classList.contains('active');
          
          // Close other faqs in this accordion
          $$('.faq-item', faqAccordion).forEach(el => {
            el.classList.remove('active');
            el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            el.querySelector('.faq-answer').style.maxHeight = '0';
          });

          // Toggle clicked
          if (!wasActive) {
            faqItem.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
            answerDiv.style.maxHeight = `${answerDiv.scrollHeight}px`;
          }
        });
      });
    } else {
      const faqSection = document.getElementById('post-faq-section');
      if (faqSection) faqSection.style.display = 'none';
    }
  }

  // Helper selectors
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ─── Initialize ─── */
  function init() {
    if (window.location.pathname.endsWith('blog-post.html')) {
      renderPost();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    posts
  };

})();
