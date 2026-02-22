const POSTS_KEY = 'discord-template-posts-v2';
const USERS_KEY = 'discord-template-users-v1';
const SESSION_KEY = 'discord-template-session-v1';

const templatesList = document.getElementById('templates-list');
const templateCard = document.getElementById('template-card');

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-btn');
const authMessage = document.getElementById('auth-message');
const currentUserNode = document.getElementById('current-user');
const sessionBox = document.getElementById('session-box');
const authForms = document.getElementById('auth-forms');

const templateForm = document.getElementById('template-form');
const linkInput = document.getElementById('template-link');
const postMessage = document.getElementById('post-message');
const postButton = document.getElementById('post-btn');

function readJson(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        return parsed;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
    const users = readJson(USERS_KEY, []);
    return Array.isArray(users) ? users : [];
}

function getPosts() {
    const posts = readJson(POSTS_KEY, []);
    return Array.isArray(posts) ? posts : [];
}

function getSession() {
    const session = readJson(SESSION_KEY, null);
    if (!session || typeof session.username !== 'string') {
        return null;
    }
    return session;
}

function setAuthMessage(message, type = '') {
    authMessage.textContent = message;
    authMessage.classList.remove('success', 'error');
    if (type) authMessage.classList.add(type);
}

function setPostMessage(message, type = '') {
    postMessage.textContent = message;
    postMessage.classList.remove('success', 'error');
    if (type) postMessage.classList.add(type);
}

function hashPassword(plainPassword) {
    return btoa(unescape(encodeURIComponent(plainPassword))).split('').reverse().join('');
}

function extractTemplateCode(rawValue) {
    try {
        const parsed = new URL(rawValue.trim());
        const validHosts = ['discord.new', 'discord.com', 'www.discord.com'];

        if (!validHosts.includes(parsed.hostname)) {
            return null;
        }

        const segments = parsed.pathname.split('/').filter(Boolean);
        if (parsed.hostname === 'discord.new') {
            return segments[0] || null;
        }

        const templateIndex = segments.findIndex((part) => part === 'template');
        if (templateIndex === -1) {
            return null;
        }

        return segments[templateIndex + 1] || null;
    } catch {
        return null;
    }
}

function mapTemplateData(apiData, sourceUrl, author) {
    const serializedSourceGuild = apiData.serialized_source_guild || {};
    const channels = (serializedSourceGuild.channels || [])
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((channel) => channel.name)
        .filter(Boolean);

    const roles = (serializedSourceGuild.roles || [])
        .map((role) => role.name)
        .filter((name) => name && name !== '@everyone');

    return {
        id: crypto.randomUUID(),
        code: apiData.code,
        name: apiData.name || 'Untitled template',
        usageCount: apiData.usage_count || 0,
        channels: channels.length ? channels : ['No channels listed'],
        roles: roles.length ? roles : ['No custom roles listed'],
        sourceUrl,
        author,
        createdAt: new Date().toISOString(),
    };
}

function updateAuthUI() {
    const session = getSession();
    const isLoggedIn = !!session;

    sessionBox.classList.toggle('hidden', !isLoggedIn);
    authForms.classList.toggle('hidden', isLoggedIn);

    if (isLoggedIn) {
        currentUserNode.textContent = session.username;
    }

    postButton.disabled = !isLoggedIn;
    linkInput.disabled = !isLoggedIn;

    if (!isLoggedIn) {
        setPostMessage('Login or sign up first to post a template.', 'error');
    } else {
        setPostMessage('');
    }
}

function renderPosts() {
    const session = getSession();
    const posts = getPosts();
    templatesList.innerHTML = '';

    if (!posts.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No templates posted yet. Sign in and add the first one.';
        templatesList.append(emptyState);
        return;
    }

    posts.forEach((post) => {
        const clone = templateCard.content.cloneNode(true);
        clone.querySelector('.template-name').textContent = post.name;
        clone.querySelector('.template-code').textContent = `Code: ${post.code}`;
        clone.querySelector('.usage-badge').textContent = `${post.usageCount || 0} Uses`;
        clone.querySelector('.template-author').textContent = post.author;

        const linkNode = clone.querySelector('.template-link');
        linkNode.href = post.sourceUrl;

        const channelsList = clone.querySelector('.channels-list');
        post.channels.forEach((channel) => {
            const item = document.createElement('li');
            item.textContent = `# ${channel}`;
            channelsList.append(item);
        });

        const rolesList = clone.querySelector('.roles-list');
        post.roles.forEach((role) => {
            const item = document.createElement('li');
            item.textContent = role;
            rolesList.append(item);
        });

        const deleteButton = clone.querySelector('.delete-template-btn');
        const canDelete = session && session.username === post.author;
        deleteButton.classList.toggle('hidden', !canDelete);
        if (canDelete) {
            deleteButton.addEventListener('click', () => {
                const remainingPosts = getPosts().filter((entry) => entry.id !== post.id);
                writeJson(POSTS_KEY, remainingPosts);
                renderPosts();
                setPostMessage('Template deleted.', 'success');
            });
        }

        templatesList.append(clone);
    });
}

async function fetchTemplate(templateCode) {
    const response = await fetch(`https://discord.com/api/v9/guilds/templates/${templateCode}`);
    if (!response.ok) {
        throw new Error('Could not fetch template. Check if the link is valid and public.');
    }
    return response.json();
}

signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || username.length < 3) {
        setAuthMessage('Username must be at least 3 characters.', 'error');
        return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        setAuthMessage('That username already exists. Try another one.', 'error');
        return;
    }

    const newUser = {
        id: crypto.randomUUID(),
        username,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };

    writeJson(USERS_KEY, [...users, newUser]);
    writeJson(SESSION_KEY, { username: newUser.username });

    signupForm.reset();
    setAuthMessage('Account created. You are now logged in.', 'success');
    updateAuthUI();
    renderPosts();
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const match = users.find((user) => user.username.toLowerCase() === username.toLowerCase());

    if (!match || match.passwordHash !== hashPassword(password)) {
        setAuthMessage('Invalid username or password.', 'error');
        return;
    }

    writeJson(SESSION_KEY, { username: match.username });
    loginForm.reset();
    setAuthMessage('Logged in successfully.', 'success');
    updateAuthUI();
    renderPosts();
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthMessage('Logged out.', 'success');
    updateAuthUI();
    renderPosts();
});

templateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const session = getSession();
    if (!session) {
        setPostMessage('You must login first before posting.', 'error');
        return;
    }

    const rawLink = linkInput.value;
    const code = extractTemplateCode(rawLink);

    if (!code) {
        setPostMessage('Please enter a valid Discord template URL.', 'error');
        return;
    }

    setPostMessage('Fetching template...');

    try {
        const templateData = await fetchTemplate(code);
        const newPost = mapTemplateData(templateData, rawLink, session.username);

        const existingPosts = getPosts();
        const updatedPosts = [newPost, ...existingPosts.filter((post) => post.code !== newPost.code)];
        writeJson(POSTS_KEY, updatedPosts);

        renderPosts();
        setPostMessage('Template posted successfully.', 'success');
        templateForm.reset();
    } catch (error) {
        setPostMessage(error.message || 'Failed to fetch template.', 'error');
    }
});

updateAuthUI();
renderPosts();
