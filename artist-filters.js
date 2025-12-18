(function () {
  function initArtistDisclosureAccordion() {
    var detailsList = document.querySelectorAll('.artist-terms--disclosure details');
    if (!detailsList || detailsList.length === 0) return;

    detailsList.forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (!details.open) return;

        detailsList.forEach(function (other) {
          if (other !== details && other.open) {
            other.open = false;
          }
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArtistDisclosureAccordion);
  } else {
    initArtistDisclosureAccordion();
  }
})();
