import { Category } from "./categories";
import { showArticles } from "./fetch";

export default function AllLatest() {
  return showArticles(Category.Vue)
}
