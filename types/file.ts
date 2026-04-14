export type FileType = "PDF" | "XLSX" | "PPTX" | "DOCX" | "CSV";
export type FileStatus = "공유중" | "초안" | "만료";

export type SharedFile = {
  id: string;
  title: string;
  fileType: FileType;
  sizeMb: number;
  creator: string;
  creatorTeam: string;
  sharedTo: string;
  status: FileStatus;
  tags: string[];
  createdAt: string;
  sharedAt: string;
  updatedAt: string;
  viewCount: number;
  downloadCount: number;
  commentCount: number;
};
