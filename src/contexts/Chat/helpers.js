export function determineSelectedChatTab({
  currentSelectedChatTab,
  selectedChatTab,
  selectedChannel
}) {
  let newSelectedChatTab = currentSelectedChatTab;
  if (selectedChatTab) {
    newSelectedChatTab = selectedChatTab;
  } else if (currentSelectedChatTab === 'class' && !selectedChannel?.isClass) {
    newSelectedChatTab = 'home';
  }
  return newSelectedChatTab;
}
