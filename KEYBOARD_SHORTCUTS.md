# 🎨 Etendy Keyboard Shortcuts Guide

Quick reference for all keyboard shortcuts in the Etendy Image Generator.

---

## 🖱️ Selection

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Select Element** | `Click` | Select a single element (clears previous selection) |
| **Multi-Select** | `Ctrl + Click` | Add or remove element from selection |
| **Deselect All** | `Click Empty Space` | Clear all selections |

---

## ⌨️ Editing

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Undo** | `Ctrl + Z` | Undo the last action (up to 30 steps) |
| **Delete** | `Delete` | Delete all selected elements |
| **Delete** | `Backspace` | Alternative delete key (same as Delete) |

---

## 🔗 Grouping

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Group Elements** | `Ctrl + G` | Group 2+ selected elements to move together |

---

## 🎯 Canvas Interaction

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Drag Element** | `Click + Drag` | Move selected element(s) |
| **Resize Element** | `Drag Handle` | Resize element (single selection only) |
| **Proportional Resize** | `Shift + Drag Handle` | Maintain aspect ratio while resizing |
| **Center Resize** | `Alt + Drag Handle` | Resize from center (rectangles only) |

---

## 💡 Tips

### Multi-Select Workflow
1. Hold `Ctrl` and click multiple elements
2. All selected elements show blue dashed borders
3. Press `Ctrl + G` to group them
4. Now they move together as one unit!

### Undo Workflow
1. Make changes to your canvas
2. Press `Ctrl + Z` to undo
3. Each undo step goes back one action
4. Works with all changes (elements, background, etc.)

### Group Workflow
1. Select 2 or more elements with `Ctrl + Click`
2. Press `Ctrl + G` to group
3. Click any group member to select the group
4. Drag to move all members together

---

## 🖥️ Platform Notes

- **Windows/Linux**: Use `Ctrl` key
- **Mac**: Use `Cmd` (⌘) key instead of Ctrl
- All shortcuts work the same on both platforms

---

## 🚫 Limitations

- Keyboard shortcuts are disabled when typing in text fields
- Resize handles only appear for single element selection
- Grouping requires at least 2 elements selected
- Undo is limited to the last 30 actions

---

## 🎓 Pro Tips

1. **Quick Selection**: Click an element in the Layers panel to select it
2. **Visual Feedback**: Selected elements always show blue dashed borders
3. **Group Indicator**: Console logs confirm successful grouping
4. **Safe Delete**: Delete key won't work while typing text
5. **Snap to Center**: Elements snap to canvas center while dragging

---

**Need Help?** Check the full documentation in `MULTI_SELECT_FEATURES.md`
