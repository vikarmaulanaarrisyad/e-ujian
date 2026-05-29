const fs = require('fs');

function replaceFile(path, replacer) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
}

// 1. BatchSklDownloader
replaceFile('e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx', content => {
  return content.replace(
    /interface BatchSklDownloaderProps \{/,
    'interface BatchSklDownloaderProps { withTranscript?: boolean;'
  );
});

// 2. IndividualSklDownloader
replaceFile('e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx', content => {
  return content.replace(
    /interface IndividualSklDownloaderProps \{/,
    'interface IndividualSklDownloaderProps { withTranscript?: boolean;'
  );
});

console.log('Fixed typescript interfaces!');
