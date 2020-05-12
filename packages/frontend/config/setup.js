window.matchMedia =
  window.matchMedia ||
  // eslint-disable-next-line
  function () {
    return {
      matches: false,
      // eslint-disable-next-line
      addListener: () => true,
      // eslint-disable-next-line
      removeListener: () => true,
    };
  };
