import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Gửi sự kiện pageview lên GA4 mỗi khi URL thay đổi
    ReactGA.send({ 
      hitType: 'pageview', 
      page: location.pathname + location.search 
    });
  }, [location]);

  return null; // Component này chạy ngầm, không render ra UI
};

export default PageTracker;
