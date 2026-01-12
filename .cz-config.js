module.exports = {
  types: [
    { value: '✨ feat', name: '✨ feat:     새로운 기능 추가' },
    { value: '🐛 fix', name: '🐛 fix:      버그 수정' },
    { value: '📝 docs', name: '📝 docs:     문서 수정' },
    { value: '💄 style', name: '💄 style:    코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)' },
    { value: '♻️ refactor', name: '♻️  refactor: 코드 리팩토링' },
    { value: '⚡ perf', name: '⚡ perf:     성능 개선' },
    { value: '🧪 test', name: '🧪 test:     테스트 코드 추가/수정' },
    { value: '🔧 chore', name: '🔧 chore:    빌드 업무 수정, 패키지 매니저 설정 등' },
    { value: '👷 ci', name: '👷 ci:       CI 설정 변경' }
  ],

  scopes: [
    { name: 'components' },
    { name: 'pages' },
    { name: 'hooks' },
    { name: 'utils' },
    { name: 'styles' },
    { name: 'config' },
    { name: 'deps' }
  ],

  messages: {
    type: '커밋 타입을 선택하세요:',
    scope: '변경 범위를 선택하세요 (선택사항):',
    customScope: '변경 범위를 입력하세요:',
    subject: '변경 사항을 간단히 설명하세요:\n',
    body: '변경 사항을 자세히 설명하세요 (선택사항). "|"로 개행:\n',
    breaking: 'BREAKING CHANGES를 설명하세요 (선택사항):\n',
    footer: '이슈를 닫을 경우 입력하세요 (예: #123) (선택사항):\n',
    confirmCommit: '위의 커밋 메시지로 진행하시겠습니까?'
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['footer'],
  subjectLimit: 100
};
