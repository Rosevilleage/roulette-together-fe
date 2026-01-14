'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Edit2, Save } from 'lucide-react';

interface NicknameEditorProps {
  nickname: string;
  onSave: (newNickname: string) => void;
}

export const NicknameEditor: React.FC<NicknameEditorProps> = ({ nickname, onSave }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newNickname, setNewNickname] = useState<string>(nickname);

  const handleSave = (): void => {
    if (!newNickname.trim()) return;
    onSave(newNickname.trim());
    setIsEditing(false);
  };

  const handleStartEditing = (): void => {
    setNewNickname(nickname);
    setIsEditing(true);
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">내 정보</h3>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-nickname">닉네임</Label>
          <div className="flex gap-2">
            <Input
              id="edit-nickname"
              type="text"
              value={newNickname}
              onChange={e => setNewNickname(e.target.value)}
              maxLength={20}
              placeholder="새 닉네임"
            />
            <Button size="icon" onClick={handleSave} disabled={!newNickname.trim()}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">닉네임</p>
            <p className="font-medium text-lg">{nickname}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleStartEditing}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};
