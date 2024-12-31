'use client'

export function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-800 rounded-lg p-3 max-w-[80%]">
        <div className="loader">
          <div className="loader-inner">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="loader-block" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Add this to your global.css or as a styled-component
const styles = `
  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 30px;
    position: relative;
  }

  .loader-inner {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .loader-block {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin: 2px;
    background-color: #fff;
    box-shadow: 0 0 20px rgba(255,255,255,0.3);
    animation: loader_562 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  }

  .loader-block:nth-child(1) { animation-delay: 0.1s; }
  .loader-block:nth-child(2) { animation-delay: 0.2s; }
  .loader-block:nth-child(3) { animation-delay: 0.3s; }
  .loader-block:nth-child(4) { animation-delay: 0.4s; }
  .loader-block:nth-child(5) { animation-delay: 0.5s; }
  .loader-block:nth-child(6) { animation-delay: 0.6s; }
  .loader-block:nth-child(7) { animation-delay: 0.7s; }
  .loader-block:nth-child(8) { animation-delay: 0.8s; }

  @keyframes loader_562 {
    0% {
      transform: scale(1);
      box-shadow: 0 0 20px rgba(255,255,255,0.3);
    }
    20% {
      transform: scale(1, 2.5);
      box-shadow: 0 0 50px rgba(255,255,255,0.5);
    }
    40% {
      transform: scale(1);
      box-shadow: 0 0 20px rgba(255,255,255,0.3);
    }
  }
` 