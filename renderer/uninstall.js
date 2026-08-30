document.getElementById('cancelBtn').addEventListener('click', function () {
  if (window.api && window.api.trayUninstallCancel) window.api.trayUninstallCancel();
  else window.close();
});

document.getElementById('confirmBtn').addEventListener('click', function () {
  if (window.api && window.api.trayUninstallConfirm) window.api.trayUninstallConfirm();
});
