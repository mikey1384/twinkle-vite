export function determineSelectedChatTab({
  currentSelectedChatTab,
  selectedChatTab,
  selectedChannel
}: {
  currentSelectedChatTab: string;
  selectedChatTab?: string;
  selectedChannel?: { isClass: boolean };
}) {
  let newSelectedChatTab = currentSelectedChatTab;
  if (selectedChatTab) {
    newSelectedChatTab = selectedChatTab;
  } else if (currentSelectedChatTab === 'class' && !selectedChannel?.isClass) {
    newSelectedChatTab = 'home';
  }
  return newSelectedChatTab;
}
