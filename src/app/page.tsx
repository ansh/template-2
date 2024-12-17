
export default function Home() {
  return (
    <main className="minimal-container">
      <div className="minimal-header">
        <h1 className="minimal-title">YAP</h1>
        <p className="minimal-subtitle">Your AI-Powered Content Assistant</p>
      </div>
      
      <div className="space-y-6">
        <a href="/youtube-quotes" className="minimal-card block hover:shadow-md transition-shadow">
          <h2 className="text-xl mb-2">YouTube Quotes</h2>
          <p className="text-gray-600">Extract meaningful quotes from any YouTube video</p>
        </a>

        <a href="/thread-analysis" className="minimal-card block hover:shadow-md transition-shadow">
          <h2 className="text-xl mb-2">Thread Analysis</h2>
          <p className="text-gray-600">Analyze and generate insights from social media threads</p>
        </a>
      </div>
    </main>
  );
}
