
(function() {
    'use strict';

    // Supabase Configuration
    const SUPABASE_URL = 'https://wmbucfrspxxrbmafygvx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnVjZnJzcHh4cmJtYWZ5Z3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjE5MzMsImV4cCI6MjA3ODczNzkzM30.NcmT9seEx5B1jiLaEwyiPPtiRU8PWyhRBD0p0-Klxwo';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const timeScale = 1.5;

    function scaledTime(ms) {
        return Math.round(ms / timeScale);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        const stage = document.getElementById('stage');
        const loader = document.getElementById('loader');

        try {
            if (loader) loader.style.display = 'flex';

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (!code) {
                throw new Error('No code provided in URL');
            }

            // Load global settings
            const { data: settings, error: settingsError } = await supabaseClient
                .from('global_settings')
                .select('*')
                .single();

            if (settingsError) throw settingsError;

            const globalSettings = {
                senderName: settings.sender_name,
                cardFrontMessage: settings.card_front_message,
                cardBackMessage: settings.card_back_message,
                envelopeColor: settings.envelope_color,
                envelopeTextColor: settings.envelope_text_color,
                titleColor: settings.title_color,
                globalImageUrl: settings.global_image_url,
                globalLogoUrl: settings.global_logo_url
            };

            // Load friend by code
            const { data: friends, error: friendsError } = await supabaseClient
                .from('friends')
                .select('id, name, code, custom_front_message, custom_back_message, envelope_color, envelope_text_color, title_color, custom_image_url, custom_logo_url')
                .eq('code', code);

            if (friendsError) throw friendsError;

            if (!friends || friends.length === 0) {
                throw new Error(`Invalid code: ${code}`);
            }

            const friendData = friends[0];
            const friend = {
                name: friendData.name,
                code: friendData.code,
                customFrontMessage: friendData.custom_front_message,
                customBackMessage: friendData.custom_back_message,
                envelopeColor: friendData.envelope_color,
                envelopeTextColor: friendData.envelope_text_color,
                titleColor: friendData.title_color,
                customImageUrl: friendData.custom_image_url,
                customLogoUrl: friendData.custom_logo_url
            };

            await applyPersonalization(globalSettings, friend);

            if (loader) loader.style.display = 'none';

            stage.classList.remove('loading');

            startAnimation();

        } catch (error) {
            console.error('Error loading card:', error);
            if (loader) {
                loader.innerHTML = `<p style="color: white;">Error: ${error.message}</p>`;
            }
        }
    }

    function generateColorShades(baseColor) {
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const lighten = (amount) => {
            const nr = Math.min(255, Math.floor(r + (255 - r) * amount));
            const ng = Math.min(255, Math.floor(g + (255 - g) * amount));
            const nb = Math.min(255, Math.floor(b + (255 - b) * amount));
            return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
        };

        const darken = (amount) => {
            const nr = Math.floor(r * (1 - amount));
            const ng = Math.floor(g * (1 - amount));
            const nb = Math.floor(b * (1 - amount));
            return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
        };

        return {
            lightest: lighten(0.15),    
            light: lighten(0.05),        
            base: baseColor,             
            medium: darken(0.1),         
            dark: darken(0.2)            
        };
    }

    async function loadAndColorSVG(svgPath, colorReplacements) {
        const response = await fetch(svgPath);
        let svgContent = await response.text();

        for (const [oldColor, newColor] of Object.entries(colorReplacements)) {
            const regex = new RegExp(oldColor, 'gi');
            svgContent = svgContent.replace(regex, newColor);
        }

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        return URL.createObjectURL(blob);
    }

    async function applyPersonalization(globalSettings, friend) {
        const senderName = document.querySelector('.sender-name');
        if (senderName && globalSettings.senderName) {
            senderName.textContent = globalSettings.senderName;
        }

        const receiverName = document.querySelector('.receiver-name');
        if (receiverName && friend.name) {
            receiverName.textContent = friend.name;
        }

        const cardSender = document.querySelector('.card-sender');
        if (cardSender && globalSettings.senderName) {
            cardSender.textContent = globalSettings.senderName;
        }

        const cardMessage = document.querySelector('.card-message');
        if (cardMessage) {
            const message = friend.customFrontMessage || globalSettings.cardFrontMessage || 'Wishing you a wonderful Christmas!';
            cardMessage.textContent = message;
        }

        const cardBackContent = document.querySelector('.card-back-content');
        if (cardBackContent) {
            const message = friend.customBackMessage || globalSettings.cardBackMessage || 'I wish you all the best for the future.';
            const formattedMessage = message.replace(/\n/g, '<br>');
            cardBackContent.innerHTML = `<p>${formattedMessage}</p>`;
        }

        const envelopeColor = friend.envelopeColor || globalSettings.envelopeColor;
        if (envelopeColor) {
            const shades = generateColorShades(envelopeColor);

            const frontColorMap = {
                '#F0DDC0': shades.lightest,
                '#E7CDA8': shades.light,
                '#D5BC96': shades.medium,
                '#C8AF88': shades.dark
            };
            const frontSvgUrl = await loadAndColorSVG('images/envelope_front.svg', frontColorMap);
            document.querySelector('.envelope_front').style.backgroundImage = `url('${frontSvgUrl}')`;

            const backColorMap = {
                '#DFC49F': shades.light,     
                '#D5BC96': shades.medium,    
                '#E7CDA8': shades.base       
            };
            const backSvgUrl = await loadAndColorSVG('images/envelope_back.svg', backColorMap);
            document.querySelector('.envelope_back_outside').style.backgroundImage = `url('${backSvgUrl}')`;

            const flapClosedColorMap = {
                '#D5BC96': shades.medium     
            };
            const flapClosedUrl = await loadAndColorSVG('images/flap_closed.svg', flapClosedColorMap);
            document.querySelector('.flap_outside').style.backgroundImage = `url('${flapClosedUrl}')`;

            const flapOpenedColorMap = {
                '#CEB38B': shades.medium,    
                '#efefef': shades.lightest   
            };
            const flapOpenedUrl = await loadAndColorSVG('images/flap_opened.svg', flapOpenedColorMap);
            document.querySelector('.flap_inside').style.backgroundImage = `url('${flapOpenedUrl}')`;

        }

        const envelopeTextColor = friend.envelopeTextColor || globalSettings.envelopeTextColor;
        if (envelopeTextColor) {
            const stampColorMap = {
                'fill="[^"]*"': `fill="${envelopeTextColor}"`
            };
            loadAndColorSVG('images/stamp.svg', stampColorMap).then(stampUrl => {
                const stampImg = document.querySelector('.stamp');
                if (stampImg) {
                    stampImg.src = stampUrl;
                }
            });

            const senderNameEl = document.querySelector('.sender-name');
            if (senderNameEl) {
                senderNameEl.style.color = envelopeTextColor;
            }

            const receiverNameEl = document.querySelector('.receiver-name');
            if (receiverNameEl) {
                receiverNameEl.style.color = envelopeTextColor;
            }
        }

        const titleColor = friend.titleColor || globalSettings.titleColor;
        if (titleColor) {
            const cardTitle = document.querySelector('.card-title');
            if (cardTitle) {
                cardTitle.style.color = titleColor;
            }
        }

        const imageUrl = friend.customImageUrl || globalSettings.globalImageUrl;
        if (imageUrl) {
            const imagePlaceholder = document.querySelector('.card-image-placeholder');
            if (imagePlaceholder) {
                let img = imagePlaceholder.querySelector('.custom-card-image');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'custom-card-image';
                    imagePlaceholder.appendChild(img);
                }
                img.src = imageUrl;
            }
        }

        const logoUrl = friend.customLogoUrl || globalSettings.globalLogoUrl;
        if (logoUrl) {
            const logoPlaceholder = document.querySelector('.card-logo-placeholder');
            if (logoPlaceholder) {
                let logo = logoPlaceholder.querySelector('.custom-card-logo');
                if (!logo) {
                    logo = document.createElement('img');
                    logo.className = 'custom-card-logo';
                    logoPlaceholder.appendChild(logo);
                }
                logo.src = logoUrl;
            }
        }
    }

    function startAnimation() {
        const envelope = document.querySelector('.envelope');

        setTimeout(() => {
            envelope.classList.add('slideIn');
        }, scaledTime(100));

        setTimeout(() => {
            envelope.classList.add('flip');

            setTimeout(() => {
                envelope.classList.add('movedDown');
            }, scaledTime(2500));
        }, scaledTime(5000));

        setTimeout(() => {
            envelope.classList.remove('closed');
        }, scaledTime(8500));

        setTimeout(() => {
            envelope.classList.add('cardRemoved');
        }, scaledTime(10000));

        setTimeout(() => {
            envelope.classList.add('dismissed');
        }, scaledTime(11400));

        setTimeout(() => {
            const card = document.querySelector('.card');
            card.classList.add('zoomed');
        }, scaledTime(12600));

        setTimeout(() => {
            const card = document.querySelector('.card');
            card.classList.add('flipped');
        }, scaledTime(17300));

        setTimeout(() => {
            window.animationFinished = true;
        }, scaledTime(18300));
    }

    function onTransitionEnd(element, callback) {
        const events = ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'MSTransitionEnd'];

        function handler(e) {
            events.forEach(event => {
                element.removeEventListener(event, handler);
            });
            callback(e);
        }

        events.forEach(event => {
            element.addEventListener(event, handler);
        });
    }

    window.restartAnimation = function() {
        location.reload();
    };

    window.getTimeScale = function() {
        return timeScale;
    };

})();
