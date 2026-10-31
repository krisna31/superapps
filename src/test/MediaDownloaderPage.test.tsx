import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { MediaDownloaderPage } from '@/pages/MediaDownloaderPage';
import * as mediaService from '@/services/mediaService';

describe('MediaDownloaderPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <AuthProvider>
        <BrowserRouter>
          <MediaDownloaderPage />
        </BrowserRouter>
      </AuthProvider>
    );

  it('renders title, input, and platform indicator', () => {
    renderComponent();
    expect(screen.getByText('Media Downloader')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste Instagram Reel/i)).toBeInTheDocument();
    expect(screen.getByText('Extract Media')).toBeInTheDocument();
    expect(screen.getByText('Video (MP4)')).toBeInTheDocument();
    expect(screen.getByText('Audio (MP3)')).toBeInTheDocument();
  });

  it('detects Instagram platform as the user types', () => {
    renderComponent();
    const input = screen.getByPlaceholderText(/Paste Instagram Reel/i);
    fireEvent.change(input, { target: { value: 'https://www.instagram.com/reel/C123456789/' } });
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('detects TikTok platform as the user types', () => {
    renderComponent();
    const input = screen.getByPlaceholderText(/Paste Instagram Reel/i);
    fireEvent.change(input, { target: { value: 'https://www.tiktok.com/@creator/video/987654321' } });
    expect(screen.getByText('TikTok')).toBeInTheDocument();
  });

  it('renders media preview player upon successful extraction', async () => {
    vi.spyOn(mediaService, 'extractMedia').mockResolvedValue({
      status: 'single',
      platform: 'instagram',
      url: 'https://cdn.example.com/test-video.mp4',
      filename: 'instagram-test.mp4',
      title: 'instagram-test.mp4',
    });

    renderComponent();
    const input = screen.getByPlaceholderText(/Paste Instagram Reel/i);
    fireEvent.change(input, { target: { value: 'https://www.instagram.com/reel/C123456789/' } });

    const submitBtn = screen.getByText('Extract Media');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Extracted Media Preview')).toBeInTheDocument();
      expect(screen.getByText('Download to Device')).toBeInTheDocument();
      expect(screen.getByText('Copy Stream Link')).toBeInTheDocument();
      expect(screen.getByText('Open in New Tab')).toBeInTheDocument();
    });
  });

  it('renders carousel album grid when picker status is returned', async () => {
    vi.spyOn(mediaService, 'extractMedia').mockResolvedValue({
      status: 'picker',
      platform: 'instagram',
      title: 'INSTAGRAM Album (2 items)',
      audioUrl: 'https://cdn.example.com/bg.mp3',
      audioFilename: 'bg.mp3',
      picker: [
        { type: 'photo', url: 'https://cdn.example.com/photo1.jpg' },
        { type: 'video', url: 'https://cdn.example.com/clip1.mp4' },
      ],
    });

    renderComponent();
    const input = screen.getByPlaceholderText(/Paste Instagram Reel/i);
    fireEvent.change(input, { target: { value: 'https://www.instagram.com/p/Album123/' } });

    fireEvent.click(screen.getByText('Extract Media'));

    await waitFor(() => {
      expect(screen.getByText(/Album Assets: 2 items detected/i)).toBeInTheDocument();
      expect(screen.getByText('Download All Items')).toBeInTheDocument();
      expect(screen.getByText('Download Audio Track')).toBeInTheDocument();
      expect(screen.getByText('#1 PHOTO')).toBeInTheDocument();
      expect(screen.getByText('#2 VIDEO')).toBeInTheDocument();
    });
  });

  it('displays error message if extraction fails', async () => {
    vi.spyOn(mediaService, 'extractMedia').mockRejectedValue(
      new Error('The requested post is private or rate-limited.')
    );

    renderComponent();
    const input = screen.getByPlaceholderText(/Paste Instagram Reel/i);
    fireEvent.change(input, { target: { value: 'https://www.instagram.com/p/private123/' } });

    fireEvent.click(screen.getByText('Extract Media'));

    await waitFor(() => {
      expect(screen.getByText(/The requested post is private or rate-limited/i)).toBeInTheDocument();
    });
  });

  it('opens API settings modal to configure custom Cobalt instance', async () => {
    renderComponent();
    const settingsBtn = screen.getByText('API Settings');
    fireEvent.click(settingsBtn);

    expect(screen.getByText('Media Extractor Settings')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://my-cobalt.example.com')).toBeInTheDocument();
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
  });
});
