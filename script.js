const STORAGE_KEY = 'discord-template-posts-v1';

const form = document.getElementById('template-form');
const linkInput = document.getElementById('template-link');
const formMessage = document.getElementById('form-message');
const templatesList = document.getElementById('templates-list');
const templateCard = document.getElementById('template-card');
const clearButton = document.getElementById('clear-templates');

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

function setFormMessage(message, type = '') {
    formMessage.textContent = message;
    formMessage.classList.remove('success', 'error');
    if (type) {
        formMessage.classList.add(type);
    }
}

function loadPosts() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts(posts) {
    templatesList.innerHTML = '';

    if (!posts.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No templates posted yet. Add one above to get started.';
        templatesList.append(emptyState);
        return;
    }

    posts.forEach((post) => {
        const clone = templateCard.content.cloneNode(true);

        clone.querySelector('.template-name').textContent = post.name;

        const linkNode = clone.querySelector('.template-link');
        linkNode.href = post.sourceUrl;
        linkNode.textContent = 'Open template';

        clone.querySelector('.template-code').textContent = `Code: ${post.code}`;
        clone.querySelector('.template-usage').textContent = `Uses: ${post.usageCount || 0}`;

        const channelsList = clone.querySelector('.channels-list');
        post.channels.forEach((channel) => {
            const item = document.createElement('li');
            item.textContent = `#${channel}`;
            channelsList.append(item);
        });

        const rolesList = clone.querySelector('.roles-list');
        post.roles.forEach((role) => {
            const item = document.createElement('li');
            item.textContent = role;
            rolesList.append(item);
        });

        templatesList.append(clone);
    });
}

function mapTemplateData(apiData, sourceUrl) {
    const serializedSourceGuild = apiData.serialized_source_guild || {};
    const channels = (serializedSourceGuild.channels || [])
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((channel) => channel.name)
        .filter(Boolean);

    const roles = (serializedSourceGuild.roles || [])
        .map((role) => role.name)
        .filter((name) => name && name !== '@everyone');

    return {
        code: apiData.code,
        name: apiData.name || 'Untitled template',
        usageCount: apiData.usage_count || 0,
        channels: channels.length ? channels : ['No channels listed'],
        roles: roles.length ? roles : ['No custom roles listed'],
        sourceUrl,
        fetchedAt: new Date().toISOString(),
    };
}

async function fetchTemplate(templateCode) {
    const response = await fetch(`https://discord.com/api/v9/guilds/templates/${templateCode}`);
    if (!response.ok) {
        throw new Error('Could not fetch template. Make sure the link is valid and public.');
    }

    return response.json();
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const rawLink = linkInput.value;
    const code = extractTemplateCode(rawLink);

    if (!code) {
        setFormMessage('Please enter a valid Discord template link.', 'error');
        return;
    }

    setFormMessage('Fetching template details...');

    try {
        const templateData = await fetchTemplate(code);
        const newPost = mapTemplateData(templateData, rawLink);

        const existingPosts = loadPosts();
        const updatedPosts = [newPost, ...existingPosts.filter((post) => post.code !== newPost.code)];

        savePosts(updatedPosts);
        renderPosts(updatedPosts);

        setFormMessage('Template added successfully.', 'success');
        form.reset();
    } catch (error) {
        setFormMessage(error.message, 'error');
    }
});

clearButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderPosts([]);
    setFormMessage('Cleared all saved templates.');
});

renderPosts(loadPosts());
