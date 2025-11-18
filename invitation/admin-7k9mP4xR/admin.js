// Supabase Configuration
const SUPABASE_URL = 'https://wmbucfrspxxrbmafygvx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnVjZnJzcHh4cmJtYWZ5Z3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjE5MzMsImV4cCI6MjA3ODczNzkzM30.NcmT9seEx5B1jiLaEwyiPPtiRU8PWyhRBD0p0-Klxwo';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appState = {
    globalSettings: {
        senderName: 'Andrew Reinert',
        cardFrontMessage: 'Wishing you a wonderful Christmas!',
        cardBackMessage: 'I wish you all the best for the future. May this holiday season bring you joy and happiness.',
        envelopeColor: '#E7CDA8',
        envelopeTextColor: '#5a4a3a',
        titleColor: '#2c5f2d',
        globalImageUrl: '',
        globalLogoUrl: ''
    },
    friends: []
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInitialize();
});

// Authentication Functions
async function checkAuthAndInitialize() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session) {
        // User is logged in - show admin app
        showAdminApp();
        initializeApp();
    } else {
        // User is not logged in - show login screen
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminApp').style.display = 'none';
    
    // Setup login form handler
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function showAdminApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    // Reset error
    loginError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Login successful - show admin app
        showAdminApp();
        initializeApp();
        
    } catch (error) {
        console.error('Login failed:', error);
        loginError.textContent = error.message || 'Invalid email or password';
        loginError.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

async function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        await supabaseClient.auth.signOut();
        window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
        showNotification('Logout failed', 'error');
    }
}

function initializeApp() {
    document.getElementById('addFriendBtn').addEventListener('click', openAddFriendModal);
    document.getElementById('saveFriendBtn').addEventListener('click', saveFriend);

    document.getElementById('friendCustomLogo').addEventListener('change', (e) => {
        document.getElementById('friendLogoUrl').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('friendCustomCard').addEventListener('change', (e) => {
        document.getElementById('friendImageUrl').style.display = e.target.checked ? 'block' : 'none';
    });

    ['senderName', 'cardFrontMessage', 'cardBackMessage', 'envelopeColor', 'envelopeTextColor', 'titleColor', 'globalImageUrl', 'globalLogoUrl'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', autoSave);
        element.addEventListener('blur', autoSave);
    });

    loadData();
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (window.innerWidth <= 768) {
        toggleMobileMenu();
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Removed makeApiRequest - using Supabase client directly

async function loadData() {
    try {
        updateStatusIndicator('loading');

        // Load global settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('global_settings')
            .select('*')
            .single();

        if (settingsError) throw settingsError;

        if (settings) {
            appState.globalSettings = {
                senderName: settings.sender_name,
                cardFrontMessage: settings.card_front_message,
                cardBackMessage: settings.card_back_message,
                envelopeColor: settings.envelope_color,
                envelopeTextColor: settings.envelope_text_color,
                titleColor: settings.title_color,
                globalImageUrl: settings.global_image_url,
                globalLogoUrl: settings.global_logo_url
            };
        }

        // Load friends (public data)
        const { data: friends, error: friendsError } = await supabaseClient
            .from('friends')
            .select('*')
            .order('created_at', { ascending: true });

        if (friendsError) throw friendsError;

        // Load private data (emails) - only accessible to authenticated users
        const { data: privateData, error: privateError } = await supabaseClient
            .from('friend_private_data')
            .select('*');

        if (privateError) throw privateError;

        // Create a map of friend_id -> email
        const emailMap = {};
        (privateData || []).forEach(pd => {
            emailMap[pd.friend_id] = pd.email;
        });

        const baseUrl = window.location.origin + window.location.pathname.replace(/admin-[^/]+\/.*$/, 'card/index.html');

        appState.friends = (friends || []).map(friend => ({
            id: friend.id,
            name: friend.name,
            code: friend.code,
            email: emailMap[friend.id] || null,
            customFrontMessage: friend.custom_front_message,
            customBackMessage: friend.custom_back_message,
            envelopeColor: friend.envelope_color,
            envelopeTextColor: friend.envelope_text_color,
            titleColor: friend.title_color,
            customLogoUrl: friend.custom_logo_url,
            customImageUrl: friend.custom_image_url,
            emailHTML: friend.email_html || createEmailTemplate(
                friend.name,
                `${baseUrl}?code=${friend.code}`,
                appState.globalSettings.senderName,
                friend.envelope_color || appState.globalSettings.envelopeColor,
                friend.envelope_text_color || appState.globalSettings.envelopeTextColor
            )
        }));

        updateUI();
        updateStatusIndicator('connected');
    } catch (error) {
        console.error('Load failed:', error);
        updateStatusIndicator('error');
        showNotification(`Error loading data: ${error.message}`, 'error');
    }
}

async function autoSave() {
    try {
        collectGlobalSettings();
        updateStatusIndicator('loading');

        // Save global settings
        const { error: settingsError } = await supabaseClient
            .from('global_settings')
            .update({
                sender_name: appState.globalSettings.senderName,
                card_front_message: appState.globalSettings.cardFrontMessage,
                card_back_message: appState.globalSettings.cardBackMessage,
                envelope_color: appState.globalSettings.envelopeColor,
                envelope_text_color: appState.globalSettings.envelopeTextColor,
                title_color: appState.globalSettings.titleColor,
                global_image_url: appState.globalSettings.globalImageUrl,
                global_logo_url: appState.globalSettings.globalLogoUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (settingsError) throw settingsError;

        updateStatusIndicator('connected');
    } catch (error) {
        console.error('Auto-save failed:', error);
        updateStatusIndicator('error');
        showNotification(`Error saving: ${error.message}`, 'error');
    }
}

function updateUI() {
    document.getElementById('senderName').value = appState.globalSettings.senderName;
    document.getElementById('cardFrontMessage').value = appState.globalSettings.cardFrontMessage || '';
    document.getElementById('cardBackMessage').value = appState.globalSettings.cardBackMessage || '';
    document.getElementById('envelopeColor').value = appState.globalSettings.envelopeColor;
    document.getElementById('envelopeTextColor').value = appState.globalSettings.envelopeTextColor || '#5a4a3a';
    document.getElementById('titleColor').value = appState.globalSettings.titleColor;
    document.getElementById('globalImageUrl').value = appState.globalSettings.globalImageUrl || '';
    document.getElementById('globalLogoUrl').value = appState.globalSettings.globalLogoUrl || '';

    renderFriendsList();

    renderLinksList();

    renderEmailTemplates();
}

function collectGlobalSettings() {
    appState.globalSettings = {
        senderName: document.getElementById('senderName').value,
        cardFrontMessage: document.getElementById('cardFrontMessage').value,
        cardBackMessage: document.getElementById('cardBackMessage').value,
        envelopeColor: document.getElementById('envelopeColor').value,
        envelopeTextColor: document.getElementById('envelopeTextColor').value,
        titleColor: document.getElementById('titleColor').value,
        globalImageUrl: document.getElementById('globalImageUrl').value,
        globalLogoUrl: document.getElementById('globalLogoUrl').value
    };
}

function renderFriendsList() {
    const container = document.getElementById('friendsList');
    const emptyState = document.getElementById('emptyState');

    if (appState.friends.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    container.innerHTML = appState.friends.map((friend, index) => `
        <div class="friend-item">
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(friend.name)} <span class="friend-code">#${friend.code || '????'}</span></div>
                <div class="friend-details">
                    ${friend.email ? `<span>📧 ${escapeHtml(friend.email)}</span>` : ''}
                    <span>🎨 <span class="color-preview" style="background-color: ${friend.envelopeColor || appState.globalSettings.envelopeColor}"></span></span>
                    ${friend.customFrontMessage || friend.customBackMessage ? '<span>✉️ Custom messages</span>' : ''}
                </div>
            </div>
            <div class="friend-actions">
                <button class="btn btn-secondary" onclick="editFriend(${index})">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteFriend(${index})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function renderLinksList() {
    const container = document.getElementById('linksList');
    const baseUrl = window.location.origin + window.location.pathname.replace(/admin-[^\/]+\/.*$/, 'card/index.html');

    if (appState.friends.length === 0) {
        container.innerHTML = '<p class="empty-state">No friends added yet. Add friends to generate links.</p>';
        return;
    }

    container.innerHTML = appState.friends.map((friend, index) => {
        const code = friend.code || generateUniqueCode(); 
        const url = `${baseUrl}?code=${code}`; 

        return `
            <div class="link-item">
                <div class="link-info">
                    <div class="link-name">${escapeHtml(friend.name)} <span class="friend-code">#${code}</span></div>
                    <div class="link-url" title="${url}">...?code=${code}</div>
                </div>
                <div class="link-actions">
                    <button class="btn btn-outline btn-sm" onclick="copyLink('${url}')">📋 Copy</button>
                    <button class="btn btn-primary btn-sm" onclick="openCardPreview('${url}')">👁️ Preview</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderEmailTemplates() {
    const container = document.getElementById('emailTemplatesList');
    const baseUrl = window.location.origin + window.location.pathname.replace(/admin-[^\/]+\/.*$/, 'card/index.html');

    if (appState.friends.length === 0) {
        container.innerHTML = '<p class="empty-state">No friends added yet. Add friends to generate email templates.</p>';
        return;
    }

    container.innerHTML = appState.friends.map((friend, index) => {
        const code = friend.code || generateUniqueCode();
        const url = `${baseUrl}?code=${code}`;

        const envelopeColor = friend.envelopeColor || appState.globalSettings.envelopeColor;
        const envelopeTextColor = friend.envelopeTextColor || appState.globalSettings.envelopeTextColor;
        const emailHTML = createEmailTemplate(friend.name, url, appState.globalSettings.senderName, envelopeColor, envelopeTextColor);

        return `
            <div class="email-template-item">
                <div class="email-template-header" onclick="toggleEmailAccordion(${index})">
                    <h3>${escapeHtml(friend.name)} <span class="friend-code">#${friend.code || '????'}</span></h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); copyEmailTemplate(${index})">📋 Copy Email</button>
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); copyEmailHTML(${index})">📄 Copy HTML</button>
                        <span class="accordion-icon">▼</span>
                    </div>
                </div>
                <div class="email-template-content" id="emailContent${index}" style="display: none;">
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 8px; display: block;">✏️ Click anywhere below to edit the email content:</label>
                        <div id="emailEditor${index}" contenteditable="true" class="contenteditable-email" style="width: 100%; min-height: 400px; border: 2px solid var(--border); border-radius: 8px; padding: 20px; background: white; overflow: auto; max-height: 600px;" onblur="saveEmailTemplate(${index})">${friend.emailHTML || emailHTML}</div>
                        <small style="display: block; margin-top: 8px; color: var(--text-light);">💡 Tip: You can edit text, change colors, modify the message - just click and type!</small>
                    </div>
                    <div style="margin-top: 12px;">
                        <button class="btn btn-outline btn-sm" onclick="resetEmailTemplate(${index})">🔄 Reset to Default</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function createEmailTemplate(recipientName, cardUrl, senderName, envelopeColor = '#E7CDA8', envelopeTextColor = '#5a4a3a') {
    const darkerColor = envelopeColor.replace('#', '');
    const r = parseInt(darkerColor.substr(0, 2), 16);
    const g = parseInt(darkerColor.substr(2, 2), 16);
    const b = parseInt(darkerColor.substr(4, 2), 16);
    const darkerShade = `#${Math.floor(r * 0.8).toString(16).padStart(2, '0')}${Math.floor(g * 0.8).toString(16).padStart(2, '0')}${Math.floor(b * 0.8).toString(16).padStart(2, '0')}`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Merry Christmas from ${senderName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${envelopeColor} 0%, ${darkerShade} 100%); border-radius: 8px 8px 0 0;">
                            <p style="margin: 0 0 12px 0; font-size: 14px; color: ${envelopeTextColor}; opacity: 0.8; font-family: 'Dancing Script', cursive;">From: ${senderName}</p>
                            <h1 style="margin: 0; color: ${envelopeTextColor}; font-size: 32px; font-family: Georgia, 'Times New Roman', serif;">🎄 Merry Christmas! 🎄</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #333333;">Hi ${recipientName},</p>

                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #555555;">
                                Wishing you a wonderful Christmas and a happy New Year! I hope this holiday season brings you lots of joy and happiness.
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #555555;">
                                Click below to view your card:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 0 0 20px; text-align: center;">
                                        <a href="${cardUrl}" style="display: inline-block; padding: 16px 40px; background-color: ${envelopeColor}; color: ${envelopeTextColor}; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);">
                                            🎁 View Card
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; font-size: 14px; color: #888888;">
                                Warm wishes,<br>
                                <strong style="font-size: 16px;">${senderName}</strong>
                            </p>
                            <p style="margin: 15px 0 0; font-size: 12px; color: #aaaaaa;">
                                🎅 Happy Holidays! 🎄
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function toggleEmailAccordion(index) {
    const content = document.getElementById(`emailContent${index}`);
    const header = content.previousElementSibling;
    const icon = header.querySelector('.accordion-icon');
    const isOpen = content.style.display === 'block';

    document.querySelectorAll('.email-template-content').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.accordion-icon').forEach(el => {
        el.textContent = '▼';
    });
    document.querySelectorAll('.email-template-item').forEach(el => {
        el.classList.remove('active');
    });

    if (!isOpen) {
        content.style.display = 'block';
        icon.textContent = '▲';
        header.parentElement.classList.add('active');
    }
}

async function saveEmailTemplate(index) {
    const editor = document.getElementById(`emailEditor${index}`);
    const htmlContent = editor.innerHTML;

    const friend = appState.friends[index];
    
    try {
        const { error } = await supabaseClient
            .from('friends')
            .update({ email_html: htmlContent })
            .eq('id', friend.id);

        if (error) throw error;

        appState.friends[index].emailHTML = htmlContent;
        updateStatusIndicator('connected');
    } catch (error) {
        console.error('Save email template failed:', error);
        showNotification(`Error saving email: ${error.message}`, 'error');
    }
}

function resetEmailTemplate(index) {
    const friend = appState.friends[index];
    const baseUrl = window.location.origin + window.location.pathname.replace(/admin-[^\/]+\/.*$/, 'card/index.html');
    const code = friend.code || generateUniqueCode();
    const url = `${baseUrl}?code=${code}`;

    const envelopeColor = friend.envelopeColor || appState.globalSettings.envelopeColor;
    const envelopeTextColor = friend.envelopeTextColor || appState.globalSettings.envelopeTextColor;
    const defaultHTML = createEmailTemplate(friend.name, url, appState.globalSettings.senderName, envelopeColor, envelopeTextColor);

    const editor = document.getElementById(`emailEditor${index}`);
    editor.innerHTML = defaultHTML;

    appState.friends[index].emailHTML = defaultHTML;

    autoSave();

    showNotification('Email template reset to default', 'success');
}

function copyEmailTemplate(index) {
    const editor = document.getElementById(`emailEditor${index}`);
    const htmlContent = editor.innerHTML;
    const textContent = editor.innerText;

    // Try modern clipboard API first (supports both HTML and plain text)
    if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        
        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
        });

        navigator.clipboard.write([clipboardItem])
            .then(() => {
                showNotification('Email copied! You can now paste it into your email client.', 'success');
            })
            .catch((err) => {
                console.error('Clipboard write failed:', err);
                // Fallback to legacy method
                copyEmailTemplateFallback(editor);
            });
    } else {
        // Fallback for browsers without ClipboardItem support
        copyEmailTemplateFallback(editor);
    }
}

function copyEmailTemplateFallback(editor) {
    const range = document.createRange();
    range.selectNodeContents(editor);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
        showNotification('Email copied! You can now paste it into your email client.', 'success');
    } catch (err) {
        showNotification('Failed to copy email. Please try selecting and copying manually.', 'error');
    }

    selection.removeAllRanges();
}

function copyEmailHTML(index) {
    const editor = document.getElementById(`emailEditor${index}`);
    let htmlContent = editor.innerHTML;

    // Strip unnecessary HTML wrapper tags that email clients don't need
    htmlContent = htmlContent
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<meta[^>]*>/gi, '')  // Remove meta tags
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')  // Remove title tags
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .trim();

    try {
        navigator.clipboard.writeText(htmlContent).then(() => {
            showNotification('Clean HTML copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = htmlContent;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Clean HTML copied to clipboard!', 'success');
        });
    } catch (err) {
        showNotification('Failed to copy HTML. Please try again.', 'error');
    }
}

function openAddFriendModal() {
    document.getElementById('modalTitle').textContent = 'Add Friend';
    document.getElementById('editFriendIndex').value = '';
    document.getElementById('friendName').value = '';
    document.getElementById('friendEmail').value = '';
    document.getElementById('friendFrontMessage').value = '';
    document.getElementById('friendBackMessage').value = '';
    document.getElementById('friendEnvelopeColor').value = appState.globalSettings.envelopeColor;
    document.getElementById('friendEnvelopeTextColor').value = appState.globalSettings.envelopeTextColor;
    document.getElementById('friendTitleColor').value = appState.globalSettings.titleColor;
    document.getElementById('friendCustomLogo').checked = false;
    document.getElementById('friendLogoUrl').value = '';
    document.getElementById('friendLogoUrl').style.display = 'none';
    document.getElementById('friendCustomCard').checked = false;
    document.getElementById('friendImageUrl').value = '';
    document.getElementById('friendImageUrl').style.display = 'none';

    document.getElementById('friendModal').classList.add('active');
}

function editFriend(index) {
    const friend = appState.friends[index];

    document.getElementById('modalTitle').textContent = 'Edit Friend';
    document.getElementById('editFriendIndex').value = index;
    document.getElementById('friendName').value = friend.name;
    document.getElementById('friendEmail').value = friend.email || '';
    document.getElementById('friendFrontMessage').value = friend.customFrontMessage || '';
    document.getElementById('friendBackMessage').value = friend.customBackMessage || '';
    document.getElementById('friendEnvelopeColor').value = friend.envelopeColor || appState.globalSettings.envelopeColor;
    document.getElementById('friendEnvelopeTextColor').value = friend.envelopeTextColor || appState.globalSettings.envelopeTextColor;
    document.getElementById('friendTitleColor').value = friend.titleColor || appState.globalSettings.titleColor;
    document.getElementById('friendCustomLogo').checked = !!friend.customLogoUrl;
    document.getElementById('friendLogoUrl').value = friend.customLogoUrl || '';
    document.getElementById('friendLogoUrl').style.display = friend.customLogoUrl ? 'block' : 'none';
    document.getElementById('friendCustomCard').checked = !!friend.customImageUrl;
    document.getElementById('friendImageUrl').value = friend.customImageUrl || '';
    document.getElementById('friendImageUrl').style.display = friend.customImageUrl ? 'block' : 'none';

    document.getElementById('friendModal').classList.add('active');
}

async function saveFriend() {
    const name = document.getElementById('friendName').value.trim();

    if (!name) {
        return; 
    }

    const editIndex = document.getElementById('editFriendIndex').value;
    const email = document.getElementById('friendEmail').value.trim() || null;

    // Public data (goes to friends table)
    const friendData = {
        name: name,
        custom_front_message: document.getElementById('friendFrontMessage').value.trim() || null,
        custom_back_message: document.getElementById('friendBackMessage').value.trim() || null,
        envelope_color: document.getElementById('friendEnvelopeColor').value || null,
        envelope_text_color: document.getElementById('friendEnvelopeTextColor').value || null,
        title_color: document.getElementById('friendTitleColor').value || null,
        custom_logo_url: document.getElementById('friendCustomLogo').checked ?
            document.getElementById('friendLogoUrl').value.trim() || null : null,
        custom_image_url: document.getElementById('friendCustomCard').checked ?
            document.getElementById('friendImageUrl').value.trim() || null : null
    };

    try {
        updateStatusIndicator('loading');

        if (editIndex === '') {
            // Add new friend
            friendData.code = generateUniqueCode();

            const baseUrl = window.location.origin + window.location.pathname.replace(/admin-[^\/]+\/.*$/, 'card/index.html');
            const url = `${baseUrl}?code=${friendData.code}`;
            friendData.email_html = createEmailTemplate(
                friendData.name,
                url,
                appState.globalSettings.senderName,
                friendData.envelope_color || appState.globalSettings.envelopeColor,
                friendData.envelope_text_color || appState.globalSettings.envelopeTextColor
            );

            // Insert friend (public data)
            const { data: insertedFriend, error: friendError } = await supabaseClient
                .from('friends')
                .insert([friendData])
                .select()
                .single();

            if (friendError) throw friendError;

            // Insert email (private data)
            if (email) {
                const { error: privateError } = await supabaseClient
                    .from('friend_private_data')
                    .insert([{
                        friend_id: insertedFriend.id,
                        email: email
                    }]);

                if (privateError) throw privateError;
            }
        } else {
            // Update existing friend
            const existingFriend = appState.friends[parseInt(editIndex)];
            
            // Update public data
            const { error: friendError } = await supabaseClient
                .from('friends')
                .update(friendData)
                .eq('id', existingFriend.id);

            if (friendError) throw friendError;

            // Update/insert email (private data)
            const { data: existingPrivate } = await supabaseClient
                .from('friend_private_data')
                .select('id')
                .eq('friend_id', existingFriend.id)
                .single();

            if (existingPrivate) {
                // Update existing email
                const { error: privateError } = await supabaseClient
                    .from('friend_private_data')
                    .update({ email: email })
                    .eq('friend_id', existingFriend.id);

                if (privateError) throw privateError;
            } else if (email) {
                // Insert new email
                const { error: privateError } = await supabaseClient
                    .from('friend_private_data')
                    .insert([{
                        friend_id: existingFriend.id,
                        email: email
                    }]);

                if (privateError) throw privateError;
            }
        }

        closeFriendModal();
        await loadData(); // Reload to get updated data
        showNotification('Friend saved successfully!', 'success');
    } catch (error) {
        console.error('Save friend failed:', error);
        updateStatusIndicator('error');
        showNotification(`Error saving friend: ${error.message}`, 'error');
    }
}

async function deleteFriend(index) {
    const friend = appState.friends[index];
    
    if (!confirm(`Delete ${friend.name}?`)) {
        return;
    }

    try {
        updateStatusIndicator('loading');

        const { error } = await supabaseClient
            .from('friends')
            .delete()
            .eq('id', friend.id);

        if (error) throw error;

        await loadData(); // Reload to get updated list
        showNotification('Friend deleted successfully!', 'success');
    } catch (error) {
        console.error('Delete friend failed:', error);
        updateStatusIndicator('error');
        showNotification(`Error deleting friend: ${error.message}`, 'error');
    }
}

function closeFriendModal() {
    document.getElementById('friendModal').classList.remove('active');
}

function openCardPreview(url) {
    const modal = document.getElementById('cardPreviewModal');
    const iframe = document.getElementById('cardPreviewFrame');
    iframe.src = url;
    modal.classList.add('active');

    document.addEventListener('keydown', handlePreviewEscape);
}

function closeCardPreview() {
    const modal = document.getElementById('cardPreviewModal');
    const iframe = document.getElementById('cardPreviewFrame');
    iframe.src = '';
    modal.classList.remove('active');

    document.removeEventListener('keydown', handlePreviewEscape);
}

function handlePreviewEscape(e) {
    if (e.key === 'Escape') {
        closeCardPreview();
    }
}

function updateStatusIndicator(status) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    indicator.className = 'status-indicator';

    if (status === 'loading') {
        statusText.textContent = 'Saving...';
    } else if (status === 'connected') {
        indicator.classList.add('connected');
        statusText.textContent = 'Saved';
    } else if (status === 'error') {
        indicator.classList.add('error');
        statusText.textContent = 'Error';
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
}

function generateFriendId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function generateUniqueCode() {
    let code;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        code = Math.floor(1000 + Math.random() * 9000).toString(); 
        attempts++;
    } while (appState.friends.some(f => f.code === code) && attempts < maxAttempts);

    return code;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeFriendModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFriendModal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
    }
});
