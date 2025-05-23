// Contact support section component
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { MessageCircle, Send, BookOpen } from "lucide-react";

export function ContactSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-16"
    >
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Still need help?</CardTitle>
          <CardDescription className="text-lg">
            Our community and support team are here to help you succeed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="https://discord.gg/W2TByeuD7R"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center space-y-2 hover:bg-black/10 p-4 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">Discord Community</h3>
              <p className="text-sm text-muted-foreground">
                Join our active community for real-time help
              </p>
            </a>
            <a
              href="https://t.me/unidexfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center space-y-2 hover:bg-black/10 p-4 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Send className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold">Telegram</h3>
              <p className="text-sm text-muted-foreground">
                Chat with us on Telegram for support and updates
              </p>
            </a>
            <a
              href="https://docs.unidex.exchange/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center space-y-2 hover:bg-black/10 p-4 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Detailed technical guides and API docs
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 