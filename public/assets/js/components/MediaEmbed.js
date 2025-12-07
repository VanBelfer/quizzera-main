/**
 * MediaEmbed Component
 * Renders YouTube videos and audio files for question media
 */

export class MediaEmbed {
    /**
     * Create media embed container
     * @param {Object} media - Media configuration {youtube?: string, audio?: string}
     * @param {HTMLElement} container - Container to render into
     */
    static render(media, container) {
        if (!media || (!media.youtube && !media.audio)) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'media-embed';

        if (media.youtube) {
            wrapper.appendChild(this.createYouTubeEmbed(media.youtube));
        }

        if (media.audio) {
            wrapper.appendChild(this.createAudioPlayer(media.audio));
        }

        container.appendChild(wrapper);
    }

    /**
     * Extract YouTube video ID from URL
     */
    static extractYouTubeId(url) {
        if (!url) return null;

        // Support various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/  // Direct ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    /**
     * Create YouTube iframe embed
     */
    static createYouTubeEmbed(url) {
        const videoId = this.extractYouTubeId(url);
        if (!videoId) {
            const error = document.createElement('div');
            error.className = 'media-error';
            error.textContent = 'Invalid YouTube URL';
            return error;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'youtube-wrapper';

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        iframe.width = '100%';
        iframe.height = '315';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        iframe.title = 'YouTube video';

        wrapper.appendChild(iframe);
        return wrapper;
    }

    /**
     * Create HTML5 audio player
     */
    static createAudioPlayer(url) {
        const wrapper = document.createElement('div');
        wrapper.className = 'audio-wrapper';

        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'metadata';
        audio.className = 'audio-player';

        const source = document.createElement('source');
        source.src = url;

        // Detect audio type from extension
        if (url.endsWith('.mp3')) {
            source.type = 'audio/mpeg';
        } else if (url.endsWith('.wav')) {
            source.type = 'audio/wav';
        } else if (url.endsWith('.ogg')) {
            source.type = 'audio/ogg';
        } else if (url.endsWith('.m4a')) {
            source.type = 'audio/mp4';
        }

        audio.appendChild(source);
        audio.innerHTML += 'Your browser does not support the audio element.';

        wrapper.appendChild(audio);
        return wrapper;
    }

    /**
     * Check if media object has any content
     */
    static hasMedia(media) {
        return media && (media.youtube || media.audio);
    }
}

export default MediaEmbed;
