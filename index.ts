// Ponto de entrada do app. A tarefa dos botões do lembrete precisa estar
// definida antes de qualquer tela: com o app fechado, o Android sobe só o
// JS pra rodá-la, sem montar a navegação (ver reminderActionTask.ts).
import "./src/lib/reminders/reminderActionTask";
import "expo-router/entry";
