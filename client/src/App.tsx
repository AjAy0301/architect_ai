import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import OneButton from "@/pages/OneButton";
import HSDGenerator from "@/pages/HSDGenerator";
import PRDGenerator from "@/pages/PRDGenerator";
import CodeGeneratorArchitecture from "./pages/CodeGeneratorArchitecture";
import NotFound from "@/pages/not-found";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/onebutton" component={OneButton} />
        <Route path="/hsd-generator" component={HSDGenerator} />
        <Route path="/prd-generator" component={PRDGenerator} />
        <Route path="/code-architecture" component={CodeGeneratorArchitecture} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;