import React, { useState, useEffect } from 'react';

const FeedbackMessage = ({ message, color }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <p style={{color: color, transition: 'opacity 0.5s ease-in', opacity: visible ? '1' : 0}}>
      {message}
    </p>
  );
};

export default FeedbackMessage;
